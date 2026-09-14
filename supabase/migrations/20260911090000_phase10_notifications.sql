-- Phase 10: in-app notifications. Adds a notifications table (read-only to
-- clients except for marking their own rows read), a SECURITY DEFINER
-- create_notification() helper that is the only writer, wires it into the
-- existing status-transition RPCs from Phase 7/8, and adds a pg_cron-driven
-- daily reminder job. See docs/decisions/0007-phase10-notifications-and-pg-cron.md
-- for why submit_timesheet/resubmit_timesheet had to become SECURITY DEFINER
-- and why pg_cron was adopted.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null,
  target_type text not null,
  target_id uuid,
  link text,
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.notifications is 'In-app notifications for a single recipient. Written only via public.create_notification() (SECURITY DEFINER) or the pg_cron reminder job — never inserted directly by client code.';
comment on column public.notifications.type is 'Discriminator for icon/copy: timesheet_submitted, timesheet_approved, timesheet_rejected, timesheet_reminder_employee, timesheet_reminder_approver.';
comment on column public.notifications.link is 'App-relative path the frontend navigates to on click, e.g. /approvals.';

create index notifications_recipient_created_idx on public.notifications (recipient_id, created_at desc);
create index notifications_recipient_unread_idx on public.notifications (recipient_id, created_at desc) where read_at is null;
create index notifications_org_idx on public.notifications (organization_id);

alter table public.notifications enable row level security;

-- No insert/delete policy for authenticated: every write goes through
-- create_notification() (SECURITY DEFINER) or the reminder job, same
-- write-only-via-trigger precedent as audit_logs.
create policy "Members can view their own notifications"
  on public.notifications for select
  using (recipient_id = auth.uid());

create policy "Members can mark their own notifications read"
  on public.notifications for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Internal insert helper. Deliberately not exposed to authenticated/anon
-- (this project's default privileges grant EXECUTE on new public-schema
-- functions to authenticated automatically — see the "alter default
-- privileges ... grant execute on functions to authenticated" in
-- 20260826093405_remote_schema.sql — so this must be explicitly revoked)
-- so it can only be reached from other SECURITY DEFINER functions that have
-- already done their own authorization check.
create or replace function public.create_notification(
  p_organization_id uuid,
  p_recipient_id uuid,
  p_actor_id uuid,
  p_type text,
  p_target_type text,
  p_target_id uuid,
  p_link text,
  p_title text,
  p_body text,
  p_metadata jsonb default '{}'::jsonb
) returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification public.notifications;
begin
  insert into public.notifications (
    organization_id, recipient_id, actor_id, type, target_type, target_id, link, title, body, metadata
  ) values (
    p_organization_id, p_recipient_id, p_actor_id, p_type, p_target_type, p_target_id, p_link, p_title, p_body, coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_notification;

  return v_notification;
end;
$$;

revoke execute on function public.create_notification(uuid, uuid, uuid, text, text, uuid, text, text, text, jsonb) from authenticated, anon;

-- approve_timesheet: notify the employee. Already SECURITY DEFINER.
create or replace function public.approve_timesheet(
  p_organization_id uuid,
  p_user_id uuid,
  p_period_start date
) returns public.timesheets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_timesheet public.timesheets;
begin
  if not public.has_permission(p_organization_id, 'timesheets.approve') then
    raise exception 'insufficient_permissions' using errcode = 'P0001';
  end if;

  update public.timesheets
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), rejection_reason = null
  where organization_id = p_organization_id
    and user_id = p_user_id
    and period_start = p_period_start
    and status = 'submitted'
  returning * into v_timesheet;

  if not found then
    raise exception 'not_pending_approval' using errcode = 'P0001';
  end if;

  perform public.create_notification(
    p_organization_id, v_timesheet.user_id, auth.uid(), 'timesheet_approved',
    'timesheets', v_timesheet.id, '/timesheets',
    'Your timesheet was approved', null, '{}'::jsonb
  );

  return v_timesheet;
end;
$$;

-- reject_timesheet: notify the employee, carrying the rejection reason. Already SECURITY DEFINER.
create or replace function public.reject_timesheet(
  p_organization_id uuid,
  p_user_id uuid,
  p_period_start date,
  p_reason text
) returns public.timesheets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_timesheet public.timesheets;
begin
  if not public.has_permission(p_organization_id, 'timesheets.approve') then
    raise exception 'insufficient_permissions' using errcode = 'P0001';
  end if;

  if char_length(trim(coalesce(p_reason, ''))) not between 1 and 1000 then
    raise exception 'rejection_reason_required' using errcode = 'P0001';
  end if;

  update public.timesheets
  set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), rejection_reason = trim(p_reason)
  where organization_id = p_organization_id
    and user_id = p_user_id
    and period_start = p_period_start
    and status = 'submitted'
  returning * into v_timesheet;

  if not found then
    raise exception 'not_pending_approval' using errcode = 'P0001';
  end if;

  perform public.create_notification(
    p_organization_id, v_timesheet.user_id, auth.uid(), 'timesheet_rejected',
    'timesheets', v_timesheet.id, '/timesheets',
    'Your timesheet was rejected', v_timesheet.rejection_reason, '{}'::jsonb
  );

  return v_timesheet;
end;
$$;

-- submit_timesheet must now notify approvers, who the submitting employee
-- has no row-level rights over — becomes SECURITY DEFINER, keeping its
-- existing is_org_member/draft-only guard as the sole authorization
-- boundary (same pattern approve/reject already use).
create or replace function public.submit_timesheet(
  p_organization_id uuid,
  p_period_start date
) returns public.timesheets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period_end date := p_period_start + 6;
  v_timezone text;
  v_timesheet public.timesheets;
  v_approver_id uuid;
begin
  if not public.is_org_member(p_organization_id) then
    raise exception 'insufficient_permissions' using errcode = 'P0001';
  end if;

  select timezone into v_timezone from public.organizations where id = p_organization_id;

  if exists (
    select 1 from public.time_entries te
    where te.organization_id = p_organization_id
      and te.user_id = auth.uid()
      and te.end_time is null
      and (te.start_time at time zone coalesce(v_timezone, 'UTC'))::date between p_period_start and v_period_end
  ) then
    raise exception 'timer_running' using errcode = 'P0001';
  end if;

  insert into public.timesheets (organization_id, user_id, period_start, period_end, status, submitted_at)
  values (p_organization_id, auth.uid(), p_period_start, v_period_end, 'submitted', now())
  on conflict (organization_id, user_id, period_start)
  do update set
    status = 'submitted',
    submitted_at = now(),
    reviewed_by = null,
    reviewed_at = null,
    rejection_reason = null
  where public.timesheets.status = 'draft'
  returning * into v_timesheet;

  if not found then
    raise exception 'not_draft' using errcode = 'P0001';
  end if;

  for v_approver_id in
    select m.user_id
    from public.memberships m
    join public.role_permissions rp on rp.role_id = m.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.organization_id = p_organization_id
      and p.key = 'timesheets.approve'
      and m.status = 'active'
      and m.user_id <> auth.uid()
  loop
    perform public.create_notification(
      p_organization_id, v_approver_id, auth.uid(), 'timesheet_submitted',
      'timesheets', v_timesheet.id, '/approvals',
      'A timesheet is ready for review', null, '{}'::jsonb
    );
  end loop;

  return v_timesheet;
end;
$$;

-- resubmit_timesheet: same reasoning as submit_timesheet above.
create or replace function public.resubmit_timesheet(
  p_organization_id uuid,
  p_period_start date
) returns public.timesheets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period_end date := p_period_start + 6;
  v_timezone text;
  v_timesheet public.timesheets;
  v_approver_id uuid;
begin
  if not public.is_org_member(p_organization_id) then
    raise exception 'insufficient_permissions' using errcode = 'P0001';
  end if;

  select timezone into v_timezone from public.organizations where id = p_organization_id;

  if exists (
    select 1 from public.time_entries te
    where te.organization_id = p_organization_id
      and te.user_id = auth.uid()
      and te.end_time is null
      and (te.start_time at time zone coalesce(v_timezone, 'UTC'))::date between p_period_start and v_period_end
  ) then
    raise exception 'timer_running' using errcode = 'P0001';
  end if;

  update public.timesheets
  set status = 'submitted', submitted_at = now(), reviewed_by = null, reviewed_at = null, rejection_reason = null
  where organization_id = p_organization_id
    and user_id = auth.uid()
    and period_start = p_period_start
    and status = 'rejected'
  returning * into v_timesheet;

  if not found then
    raise exception 'not_rejected' using errcode = 'P0001';
  end if;

  for v_approver_id in
    select m.user_id
    from public.memberships m
    join public.role_permissions rp on rp.role_id = m.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.organization_id = p_organization_id
      and p.key = 'timesheets.approve'
      and m.status = 'active'
      and m.user_id <> auth.uid()
  loop
    perform public.create_notification(
      p_organization_id, v_approver_id, auth.uid(), 'timesheet_submitted',
      'timesheets', v_timesheet.id, '/approvals',
      'A timesheet is ready for review', null, '{}'::jsonb
    );
  end loop;

  return v_timesheet;
end;
$$;

-- Reminders: daily pg_cron job. Idempotent per (recipient, type, target) —
-- skips inserting if an unread reminder for the same target already exists,
-- so a run doesn't spam duplicates and self-heals once the condition
-- resolves or the recipient reads it.
create extension if not exists pg_cron;

create or replace function public.run_timesheet_reminders() returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org record;
  v_row record;
begin
  for v_org in select id, timezone from public.organizations loop
    -- Employees whose most-recently-ended period is still a draft.
    for v_row in
      select distinct t.user_id, t.id as timesheet_id
      from public.timesheets t
      where t.organization_id = v_org.id
        and t.status = 'draft'
        and t.period_end between
          (now() at time zone coalesce(v_org.timezone, 'UTC'))::date - 1
          and (now() at time zone coalesce(v_org.timezone, 'UTC'))::date
    loop
      if not exists (
        select 1 from public.notifications
        where recipient_id = v_row.user_id
          and type = 'timesheet_reminder_employee'
          and target_id = v_row.timesheet_id
          and read_at is null
      ) then
        perform public.create_notification(
          v_org.id, v_row.user_id, null, 'timesheet_reminder_employee',
          'timesheets', v_row.timesheet_id, '/timesheets',
          'Submit your timesheet', 'Your timesheet for a recent period is still a draft.', '{}'::jsonb
        );
      end if;
    end loop;

    -- Approvers with a timesheet sitting in "submitted" for 3+ days.
    for v_row in
      select distinct t.id as timesheet_id, m.user_id as approver_id
      from public.timesheets t
      join public.memberships m on m.organization_id = t.organization_id
      join public.role_permissions rp on rp.role_id = m.role_id
      join public.permissions p on p.id = rp.permission_id
      where t.organization_id = v_org.id
        and t.status = 'submitted'
        and p.key = 'timesheets.approve'
        and m.status = 'active'
        and t.submitted_at <= now() - interval '3 days'
    loop
      if not exists (
        select 1 from public.notifications
        where recipient_id = v_row.approver_id
          and type = 'timesheet_reminder_approver'
          and target_id = v_row.timesheet_id
          and read_at is null
      ) then
        perform public.create_notification(
          v_org.id, v_row.approver_id, null, 'timesheet_reminder_approver',
          'timesheets', v_row.timesheet_id, '/approvals',
          'A timesheet is awaiting review', 'A submitted timesheet has been waiting for review for a few days.', '{}'::jsonb
        );
      end if;
    end loop;
  end loop;
end;
$$;

revoke execute on function public.run_timesheet_reminders() from authenticated, anon;

select cron.schedule(
  'timesheet-reminders-daily',
  '0 7 * * *',
  $$select public.run_timesheet_reminders();$$
);

-- Live delivery: first use of Realtime in this codebase. RLS's existing
-- "recipient_id = auth.uid()" select policy scopes postgres_changes
-- per-subscriber, same as any other query.
alter publication supabase_realtime add table public.notifications;
