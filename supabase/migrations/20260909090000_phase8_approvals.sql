-- Phase 8: approval workflow. Extends timesheets with approved/rejected
-- states, adds a new org-wide (not manager-scoped — no reports-to
-- relationship exists anywhere in this schema) timesheets.approve
-- permission, and adds approve/reject/resubmit RPCs. Approval history is
-- not a new table: the existing timesheets_audit_log trigger (Phase 5's
-- log_audit_event(), attached in Phase 7) already captures every status
-- transition, so the frontend reads audit_logs instead of duplicating it.

alter table public.timesheets drop constraint timesheets_status_check;
alter table public.timesheets add constraint timesheets_status_check
  check (status in ('draft', 'submitted', 'approved', 'rejected'));

-- References profiles (not auth.users) so the frontend can embed the
-- reviewer's name in one query, same as user_id — this does mean timesheets
-- now has two FKs to profiles, so any PostgREST embed of "profiles" must
-- disambiguate with !timesheets_user_id_fkey or !timesheets_reviewed_by_fkey.
alter table public.timesheets add column reviewed_by uuid references public.profiles (id) on delete set null;
alter table public.timesheets add column reviewed_at timestamptz;
alter table public.timesheets add column rejection_reason text
  check (rejection_reason is null or char_length(trim(rejection_reason)) between 1 and 1000);

comment on column public.timesheets.reviewed_by is 'Who last approved or rejected this timesheet (one column for both actions, mirroring submitted_at''s single-purpose style).';
comment on column public.timesheets.rejection_reason is 'Set on reject, cleared again on approve/resubmit so a stale reason never lingers next to a fresh status.';

-- Approved weeks stay locked (final, no more edits); rejected weeks must not
-- (that's the whole point of rejecting — the employee needs to fix entries).
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
      and t.status in ('submitted', 'approved')
      and (p_start_time at time zone o.timezone)::date between t.period_start and t.period_end
  );
$$;

-- Permission catalog + default grants, same pattern as Phase 5's
-- clients.manage/projects.manage. Org-wide by design: any Owner/Admin can
-- review any member's timesheet, including their own (self-approval is
-- intentional, not an oversight — there's no manager hierarchy to delegate
-- to instead).
insert into public.permissions (key, description) values
  ('timesheets.approve', 'Review, approve, and reject submitted timesheets');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.is_system
  and p.key = 'timesheets.approve'
  and r.name in ('Owner', 'Admin')
on conflict (role_id, permission_id) do nothing;

-- Reviewers need to see (not edit) any member's timesheets and time entries
-- to run the review queue and drill into a submitted week. Additive
-- permissive policies alongside the existing own-row ones from Phase 6/7.
create policy "Members with timesheets.approve can view any timesheet in their org"
  on public.timesheets for select
  using (public.has_permission(organization_id, 'timesheets.approve'));

create policy "Members with timesheets.approve can view any time entries in their org"
  on public.time_entries for select
  using (public.has_permission(organization_id, 'timesheets.approve'));

-- Approval history: reviewers can read the timesheet audit trail; an
-- employee can read the trail for their own timesheet (so they can see who
-- rejected it and why). Additive alongside the existing "audit_logs.view"
-- policy from Phase 4, which covers the general org-wide audit log page.
create policy "Members with timesheets.approve can view timesheet audit history"
  on public.audit_logs for select
  using (
    target_type = 'timesheets'
    and public.has_permission(organization_id, 'timesheets.approve')
  );

create policy "Members can view their own timesheet audit history"
  on public.audit_logs for select
  using (
    target_type = 'timesheets'
    and exists (
      select 1 from public.timesheets t
      where t.id = audit_logs.target_id and t.user_id = auth.uid()
    )
  );

-- Approve/reject act on another member's row, which plain per-row RLS can't
-- express as a guarded state transition — RPCs following ADR-0002's rule for
-- multi-condition writes, same shape as submit_timesheet/withdraw_timesheet.
create or replace function public.approve_timesheet(
  p_organization_id uuid,
  p_user_id uuid,
  p_period_start date
) returns public.timesheets
language plpgsql
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
    raise exception 'timesheet_not_submitted' using errcode = 'P0001';
  end if;

  return v_timesheet;
end;
$$;

grant execute on function public.approve_timesheet(uuid, uuid, date) to authenticated;

create or replace function public.reject_timesheet(
  p_organization_id uuid,
  p_user_id uuid,
  p_period_start date,
  p_reason text
) returns public.timesheets
language plpgsql
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
    raise exception 'timesheet_not_submitted' using errcode = 'P0001';
  end if;

  return v_timesheet;
end;
$$;

grant execute on function public.reject_timesheet(uuid, uuid, date, text) to authenticated;

-- Employee resubmits their own rejected week after fixing entries. Kept
-- separate from submit_timesheet (below) rather than folding rejected into
-- its draft->submitted contract, so that function's behavior for the
-- existing draft flow doesn't change.
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
    raise exception 'timesheet_not_rejected' using errcode = 'P0001';
  end if;

  return v_timesheet;
end;
$$;

grant execute on function public.resubmit_timesheet(uuid, date) to authenticated;

-- Now that approved/rejected exist, submit_timesheet's upsert must not
-- silently flip one of those rows back to submitted (bypassing
-- resubmit_timesheet's guard and reason-clearing) — confine the upsert's
-- update branch to draft rows only.
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
  where public.timesheets.status = 'draft'
  returning * into v_timesheet;

  if not found then
    raise exception 'timesheet_not_draft' using errcode = 'P0001';
  end if;

  return v_timesheet;
end;
$$;

-- withdraw_timesheet needs no change: its existing "and status = 'submitted'"
-- clause already confines it to submitted rows only, so it's a no-op
-- (timesheet_not_submitted) on approved/rejected rows — intentional, not a gap.
