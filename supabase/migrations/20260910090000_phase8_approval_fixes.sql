-- Reconciliation for Phase 8. The remote database was found to already have
-- a hand-applied variant of the approvals feature (reviewed_by targeting
-- profiles instead of auth.users, approve/reject using a
-- not_pending_approval error code, security definer RPCs) that predates and
-- differs from the 20260909090000 migration file in this repo. This
-- migration reconciles the two: it keeps what's already deployed and
-- working, and adds only what's genuinely missing or unsafe.
--
-- Missing entirely: resubmit_timesheet, a reviewer SELECT policy on
-- time_entries, and the two audit_logs SELECT policies for timesheet
-- history. Unsafe: submit_timesheet's upsert had no guard against
-- overwriting an approved/rejected row back to submitted.

-- submit_timesheet must not silently flip an approved/rejected row back to
-- submitted (that's what resubmit_timesheet, added below, is for).
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

  return v_timesheet;
end;
$$;

-- Reject already clears reviewed fields correctly; approve didn't clear a
-- stale rejection_reason from a prior reject->resubmit->approve cycle.
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

  return v_timesheet;
end;
$$;

-- Adds the reason-length guard as defense in depth (the frontend already
-- validates this via zod) — same error code the frontend already expects.
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

  return v_timesheet;
end;
$$;

-- Was missing entirely: the employee's own path back from rejected to
-- submitted. Error code follows the not_pending_approval naming already
-- established by approve/reject on remote.
create or replace function public.resubmit_timesheet(
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

  return v_timesheet;
end;
$$;

grant execute on function public.resubmit_timesheet(uuid, date) to authenticated;

-- Was missing: reviewers need to read another member's time entries to
-- drill into a submitted week in the review queue.
create policy "Members with timesheets.approve can view any time entries in their org"
  on public.time_entries for select
  using (public.has_permission(organization_id, 'timesheets.approve'));

-- Was missing: approval history (reviewer side and the employee's own view
-- of why their timesheet was rejected), read from the existing
-- timesheets_audit_log trigger's audit_logs rows.
drop policy if exists "Members with timesheets.approve can view timesheet audit history" on public.audit_logs;
create policy "Members with timesheets.approve can view timesheet audit history"
  on public.audit_logs for select
  using (
    target_type = 'timesheets'
    and public.has_permission(organization_id, 'timesheets.approve')
  );

drop policy if exists "Members can view their own timesheet audit history" on public.audit_logs;
create policy "Members can view their own timesheet audit history"
  on public.audit_logs for select
  using (
    target_type = 'timesheets'
    and exists (
      select 1 from public.timesheets t
      where t.id = audit_logs.target_id and t.user_id = auth.uid()
    )
  );
