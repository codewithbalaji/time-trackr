-- Phase 11: finish audit coverage for the mutations that weren't already
-- writing into the Phase 4 foundation — organizations, memberships, and
-- invitations. See docs/decisions/0008-phase11-audit-coverage.md.

-- organizations has no organization_id column (it *is* the organization), so
-- the existing fallback chain (organization_id column, then a project_id ->
-- projects.organization_id lookup) would leave v_organization_id null and
-- violate audit_logs' NOT NULL constraint. Add a table-name-specific fallback
-- before reusing the trigger here.
create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_action text;
begin
  if tg_op = 'INSERT' then
    v_action := tg_table_name || '_created';
  elsif tg_op = 'UPDATE' then
    v_action := tg_table_name || '_updated';
  else
    v_action := tg_table_name || '_deleted';
  end if;

  v_organization_id := coalesce(
    (to_jsonb(new) ->> 'organization_id')::uuid,
    (to_jsonb(old) ->> 'organization_id')::uuid
  );

  if v_organization_id is null and tg_table_name = 'organizations' then
    v_organization_id := coalesce(new.id, old.id);
  end if;

  if v_organization_id is null then
    select p.organization_id into v_organization_id
    from public.projects p
    where p.id = coalesce(
      (to_jsonb(new) ->> 'project_id')::uuid,
      (to_jsonb(old) ->> 'project_id')::uuid
    );
  end if;

  insert into public.audit_logs (organization_id, actor_id, action, target_type, target_id, metadata)
  values (
    v_organization_id,
    auth.uid(),
    v_action,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );

  return coalesce(new, old);
end;
$$;

-- organizations: settings updates only. Creation goes through
-- create_organization_with_owner() (no prior row to diff) and the app never
-- deletes an organization, so update is the only meaningful transition here.
create trigger organizations_audit_log
  after update on public.organizations
  for each row execute function public.log_audit_event();

-- invitations: same generic insert/update/delete pattern as clients/projects.
-- Covers creation, revoke (status -> 'revoked'), and resend (expires_at bump).
create trigger invitations_audit_log
  after insert or update or delete on public.invitations
  for each row execute function public.log_audit_event();

-- memberships: insert/delete cover membership creation (invite acceptance)
-- and removal. Update is filtered to status transitions only (suspend /
-- reactivate) — role changes already write their own 'role_assigned' row
-- inside assign_membership_role() in the same transaction, so an unfiltered
-- update trigger here would double-log every role change.
create trigger memberships_audit_log_write
  after insert or delete on public.memberships
  for each row execute function public.log_audit_event();

create trigger memberships_audit_log_status
  after update on public.memberships
  for each row
  when (old.status is distinct from new.status)
  execute function public.log_audit_event();
