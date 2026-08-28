-- Closes gaps found in a post-Phase-4 security audit:
--
-- 1. Suspended members kept full API access — none of is_org_member/
--    is_org_owner/has_permission/shares_org_with ever checked
--    memberships.status, despite the column's own comment claiming it
--    "controls whether the member can currently access the organization."
-- 2. assign_membership_role() let any Admin (who holds roles.assign) promote
--    themselves to Owner, or demote/strip the real Owner's role, since it
--    only checked the caller's permission, never who the target was.
-- 3. The members.manage_status/members.remove RLS policies had the same
--    gap for suspend/remove: any Admin could suspend or delete the Owner's
--    membership.
-- 4. Nothing stopped an org from ending up with zero Owners.
--
-- The UI (MembersTable.tsx's isOwner checks) already hid these actions, but
-- that's cosmetic — none of it was backed by a database-level check, so a
-- direct RPC/PostgREST call could bypass it entirely.

-- 1. Status-aware permission checks. A suspended membership no longer counts
-- as "an active member of this org" for any permission/ownership check.
create or replace function public.is_org_member(p_organization_id uuid)
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
      and m.status = 'active'
  );
$$;

create or replace function public.is_org_owner(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    join public.roles r on r.id = m.role_id
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and r.is_system
      and r.name = 'Owner'
  );
$$;

create or replace function public.has_permission(p_organization_id uuid, p_permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    join public.role_permissions rp on rp.role_id = m.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and p.key = p_permission_key
  );
$$;

-- Only the *viewer* needs to be active — a suspended member should still be
-- visible (with a "Suspended" badge) to active members browsing the
-- directory, they just shouldn't be able to browse anyone themselves.
create or replace function public.shares_org_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships mine
    join public.memberships theirs on theirs.organization_id = mine.organization_id
    where mine.user_id = auth.uid()
      and mine.status = 'active'
      and theirs.user_id = p_user_id
  );
$$;

-- 2 & 4. Hardened role assignment: can't touch your own membership through
-- this path, only an Owner may grant/revoke the Owner role, and the org's
-- last remaining active Owner can't be demoted away from it.
create or replace function public.assign_membership_role(p_membership_id uuid, p_role_id uuid)
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_target_user_id uuid;
  v_current_role_name text;
  v_new_role_name text;
  v_owner_count int;
  v_membership public.memberships;
begin
  select m.organization_id, m.user_id, r.name
  into v_organization_id, v_target_user_id, v_current_role_name
  from public.memberships m
  join public.roles r on r.id = m.role_id
  where m.id = p_membership_id;

  if v_organization_id is null then
    raise exception 'membership_not_found' using errcode = 'P0001';
  end if;

  if not public.has_permission(v_organization_id, 'roles.assign') then
    raise exception 'insufficient_permissions' using errcode = 'P0001';
  end if;

  if v_target_user_id = auth.uid() then
    raise exception 'cannot_change_own_role' using errcode = 'P0001';
  end if;

  select name into v_new_role_name
  from public.roles
  where id = p_role_id and organization_id = v_organization_id;

  if v_new_role_name is null then
    raise exception 'role_not_found' using errcode = 'P0001';
  end if;

  if (v_current_role_name = 'Owner' or v_new_role_name = 'Owner')
    and not public.is_org_owner(v_organization_id) then
    raise exception 'only_owner_can_manage_owner_role' using errcode = 'P0001';
  end if;

  if v_current_role_name = 'Owner' and v_new_role_name <> 'Owner' then
    select count(*) into v_owner_count
    from public.memberships m
    join public.roles r on r.id = m.role_id
    where m.organization_id = v_organization_id
      and r.name = 'Owner'
      and m.status = 'active';

    if v_owner_count <= 1 then
      raise exception 'cannot_remove_last_owner' using errcode = 'P0001';
    end if;
  end if;

  perform set_config('app.bypass_role_guard', 'on', true);

  update public.memberships
  set role_id = p_role_id
  where id = p_membership_id
  returning * into v_membership;

  insert into public.audit_logs (organization_id, actor_id, action, target_type, target_id, metadata)
  values (v_organization_id, auth.uid(), 'role_assigned', 'membership', p_membership_id,
          jsonb_build_object('role_id', p_role_id));

  return v_membership;
end;
$$;

-- 3 & 4. Same protection for suspend/remove, which go through plain RLS
-- (single-table writes) rather than an RPC: block targeting your own
-- membership, block a non-Owner from touching the Owner's membership, and
-- block suspending/removing the org's last remaining active Owner.
create or replace function public.can_manage_target_membership(p_membership_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_target_user_id uuid;
  v_role_name text;
  v_owner_count int;
begin
  select m.organization_id, m.user_id, r.name
  into v_organization_id, v_target_user_id, v_role_name
  from public.memberships m
  join public.roles r on r.id = m.role_id
  where m.id = p_membership_id;

  if v_organization_id is null then
    return false;
  end if;

  if v_target_user_id = auth.uid() then
    return false;
  end if;

  if v_role_name = 'Owner' then
    if not public.is_org_owner(v_organization_id) then
      return false;
    end if;

    select count(*) into v_owner_count
    from public.memberships m
    join public.roles r on r.id = m.role_id
    where m.organization_id = v_organization_id
      and r.name = 'Owner'
      and m.status = 'active';

    if v_owner_count <= 1 then
      return false;
    end if;
  end if;

  return true;
end;
$$;

drop policy if exists "Members with members.manage_status can update memberships" on public.memberships;
create policy "Members with members.manage_status can update memberships"
  on public.memberships for update
  using (
    public.has_permission(organization_id, 'members.manage_status')
    and public.can_manage_target_membership(id)
  )
  with check (
    public.has_permission(organization_id, 'members.manage_status')
    and public.can_manage_target_membership(id)
  );

drop policy if exists "Members with members.remove can remove memberships" on public.memberships;
create policy "Members with members.remove can remove memberships"
  on public.memberships for delete
  using (
    public.has_permission(organization_id, 'members.remove')
    and public.can_manage_target_membership(id)
  );
