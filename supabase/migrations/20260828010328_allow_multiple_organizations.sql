-- Phase 2: allow a user to belong to more than one organization.
-- See docs/decisions/0003-multi-organization-selection.md.
--
-- The memberships table's unique constraint is already (organization_id, user_id),
-- not user_id alone, so nothing else in the schema assumed one org per user —
-- only this RPC's guard did. Dropping it is the entire change; RLS policies and
-- accept_invitation() already scope everything per specific organization_id and
-- need no changes to support multiple memberships per user.
create or replace function public.create_organization_with_owner(p_name text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.organizations;
begin
  insert into public.organizations (name, created_by)
  values (p_name, auth.uid())
  returning * into v_org;

  insert into public.memberships (organization_id, user_id, role)
  values (v_org.id, auth.uid(), 'owner');

  return v_org;
end;
$$;
