-- Phase 7: timesheets. A timesheet is one row per member per calendar week
-- (Monday-Sunday, in the organization's timezone), tracking submission status
-- for that week. It doesn't duplicate time entry data — the weekly/daily
-- views and summaries are computed by reading time_entries for the period.
-- Submitting a timesheet locks the underlying time_entries for that week
-- (see check_time_entry_not_locked() below); withdrawing unlocks them again.
-- Team/manager visibility and reject/re-submit are Phase 8 (Approval
-- Workflow) concerns — this phase is self-service only, same as Phase 6.

-- Day/week boundaries need a timezone to compute against; there wasn't one
-- anywhere in the schema yet. Organization-level (not per-user) so every
-- member sees the same week grid.
alter table public.organizations add column timezone text not null default 'UTC';

-- CHECK constraints can't contain subqueries, so pg_timezone_names can't be
-- referenced there. AT TIME ZONE raises invalid_parameter_value for an
-- unrecognized zone name, which this trigger turns into a normal app error.
create or replace function public.validate_organization_timezone()
returns trigger
language plpgsql
as $$
begin
  perform now() at time zone new.timezone;
  return new;
exception
  when invalid_parameter_value then
    raise exception 'invalid_timezone' using errcode = 'P0001';
end;
$$;

create trigger organizations_validate_timezone
  before insert or update of timezone on public.organizations
  for each row
  execute function public.validate_organization_timezone();

create table public.timesheets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timesheets_period_end_after_start check (period_end = period_start + 6),
  unique (organization_id, user_id, period_start)
);

comment on table public.timesheets is 'One row per member per calendar week (Monday-Sunday, in the organization''s timezone). status=submitted locks the underlying time_entries for that week (see check_time_entry_not_locked()).';

create index timesheets_organization_id_user_id_period_start_idx
  on public.timesheets (organization_id, user_id, period_start);

create trigger timesheets_set_updated_at
  before update on public.timesheets
  for each row
  execute function public.set_updated_at();

alter table public.timesheets enable row level security;

-- Own timesheets only, same shape as time_entries' RLS — see that migration's
-- comment on why team/manager visibility isn't part of this phase.
create policy "Members can view their own timesheets"
  on public.timesheets for select
  using (user_id = auth.uid() and public.is_org_member(organization_id));

create policy "Members can create their own timesheets"
  on public.timesheets for insert
  with check (user_id = auth.uid() and public.is_org_member(organization_id));

create policy "Members can update their own timesheets"
  on public.timesheets for update
  using (user_id = auth.uid() and public.is_org_member(organization_id))
  with check (user_id = auth.uid() and public.is_org_member(organization_id));
-- deliberately no delete policy: a timesheet only ever transitions
-- draft <-> submitted, it's never removed.

create trigger timesheets_audit_log
  after insert or update or delete on public.timesheets
  for each row execute function public.log_audit_event();

-- Shared by the lock-check trigger below and (indirectly, via the same date
-- math) submit_timesheet(). Not security definer: every caller only ever
-- passes its own organization_id/user_id, already enforced by the RLS on
-- whichever table triggered the check, so it's fine to run under the
-- caller's own read access to organizations/timesheets.
create or replace function public.is_time_entry_period_locked(
  p_organization_id uuid,
  p_user_id uuid,
  p_start_time timestamptz
) returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.timesheets t
    join public.organizations o on o.id = p_organization_id
    where t.organization_id = p_organization_id
      and t.user_id = p_user_id
      and t.status = 'submitted'
      and (p_start_time at time zone o.timezone)::date between t.period_start and t.period_end
  );
$$;

-- Editing rules: once a week is submitted, its time entries can't be
-- inserted, edited, or deleted (from either side of an update — moving an
-- entry into a locked week is blocked too) until the timesheet is withdrawn.
-- This is the real enforcement boundary; the frontend only mirrors it for UX.
create or replace function public.check_time_entry_not_locked()
returns trigger
language plpgsql
as $$
begin
  if tg_op in ('UPDATE', 'DELETE')
    and public.is_time_entry_period_locked(old.organization_id, old.user_id, old.start_time) then
    raise exception 'time_entry_locked' using errcode = 'P0001';
  end if;

  if tg_op in ('INSERT', 'UPDATE')
    and public.is_time_entry_period_locked(new.organization_id, new.user_id, new.start_time) then
    raise exception 'time_entry_locked' using errcode = 'P0001';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger time_entries_not_locked_check
  before insert or update or delete on public.time_entries
  for each row
  execute function public.check_time_entry_not_locked();

-- Not security definer, same rationale as start_time_entry: always operates
-- on auth.uid()'s own row, so RLS on timesheets/time_entries still applies.
create or replace function public.submit_timesheet(
  p_organization_id uuid,
  p_period_start date
) returns public.timesheets
language plpgsql
as $$
declare
  v_period_end date := p_period_start + 6;
  v_timezone text;
  v_timesheet public.timesheets;
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
  do update set status = 'submitted', submitted_at = now()
  returning * into v_timesheet;

  return v_timesheet;
end;
$$;

grant execute on function public.submit_timesheet(uuid, date) to authenticated;

-- No approver exists until Phase 8, so this is the only way to unlock a
-- submitted week for now — an employee withdrawing their own submission
-- back to draft. Phase 8 will likely replace this with a real reject flow.
create or replace function public.withdraw_timesheet(
  p_organization_id uuid,
  p_period_start date
) returns public.timesheets
language plpgsql
as $$
declare
  v_timesheet public.timesheets;
begin
  update public.timesheets
  set status = 'draft', submitted_at = null
  where organization_id = p_organization_id
    and user_id = auth.uid()
    and period_start = p_period_start
    and status = 'submitted'
  returning * into v_timesheet;

  if not found then
    raise exception 'timesheet_not_submitted' using errcode = 'P0001';
  end if;

  return v_timesheet;
end;
$$;

grant execute on function public.withdraw_timesheet(uuid, date) to authenticated;
