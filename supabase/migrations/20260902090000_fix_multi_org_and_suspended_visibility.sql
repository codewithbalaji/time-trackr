-- Fixes two bugs found by manual testing of the previous hardening migration
-- (20260901090000_rbac_enforcement_hardening.sql):
--
-- 1. Regression: that migration's `create or replace function
--    create_organization_with_owner` was rewritten from the original Phase 2
--    version and silently reintroduced the "one org per user" guard that
--    20260828010328_allow_multiple_organizations.sql had deliberately
--    removed (see docs/decisions/0003-multi-organization-selection.md). Any
--    user who already belonged to an org got `already_in_organization`
--    (unmapped in organization-errors.ts, so it just showed "Something went
--    wrong") when trying to create a second one.
--
-- 2. Making is_org_member require status = 'active' (the same migration, for
--    a good reason — see its header) had a side effect nobody wants:
--    is_org_member is also what the `memberships` and `organizations` SELECT
--    RLS policies use to decide whether *you* can see a row, including your
--    OWN membership row. A suspended user's own membership (and their org's
--    name/role) became invisible to them via RLS, getMembershipsForUser()
--    returned an empty array, and the app concluded they'd never joined
--    anything — routing them to onboarding to create a brand new org instead
--    of showing "you're suspended from X".

-- 1. Restore multi-org support.
create or replace function public.create_organization_with_owner(p_name text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.organizations;
  v_owner_role_id uuid;
begin
  insert into public.organizations (name, created_by)
  values (p_name, auth.uid())
  returning * into v_org;

  insert into public.roles (organization_id, name, is_system)
  values
    (v_org.id, 'Owner', true),
    (v_org.id, 'Admin', true),
    (v_org.id, 'Member', true);

  insert into public.role_permissions (role_id, permission_id)
  select r.id, p.id
  from public.roles r
  cross join public.permissions p
  where r.organization_id = v_org.id
    and (r.name = 'Owner' or (r.name = 'Admin' and p.key <> 'organization.manage_settings'));

  select id into v_owner_role_id from public.roles where organization_id = v_org.id and name = 'Owner';

  insert into public.memberships (organization_id, user_id, role_id)
  values (v_org.id, auth.uid(), v_owner_role_id);

  return v_org;
end;
$$;

-- 2. A status-agnostic "do I belong to this org at all" check, distinct from
-- is_org_member's "am I an ACTIVE member" — used only for the narrow case of
-- letting a user see their own membership/org/role regardless of status, so
-- a suspended user can still be told which org they're suspended from
-- instead of the app pretending they were never a member.
create or replace function public.has_any_membership(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
  );
$$;

drop policy if exists "Members can view their organization" on public.organizations;
create policy "Members can view their organization"
  on public.organizations for select
  using (public.has_any_membership(id));

drop policy if exists "Members can view fellow memberships in their org" on public.memberships;
create policy "Members can view fellow memberships in their org"
  on public.memberships for select
  using (user_id = auth.uid() or public.is_org_member(organization_id));

drop policy if exists "Members can view their organization's roles" on public.roles;
create policy "Members can view their organization's roles"
  on public.roles for select
  using (public.has_any_membership(organization_id));
