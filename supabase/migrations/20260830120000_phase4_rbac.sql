-- Phase 4: roles, permissions, role assignment, permission-based authorization,
-- and a minimal audit log foundation. Database-driven (not a hardcoded matrix)
-- so an organization can eventually define custom roles, but this phase only
-- ships three seeded system roles (Owner, Admin, Member) — no custom-role UI yet.

-- Permissions are a fixed, global catalog (not per-org): every org's roles are
-- built out of the same permission keys.
create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null
);

comment on table public.permissions is 'Fixed catalog of grantable actions. Seeded here; not user-creatable.';

insert into public.permissions (key, description) values
  ('organization.manage_settings', 'Manage organization identity and settings'),
  ('members.invite', 'Invite, view, revoke, and resend invitations'),
  ('members.remove', 'Remove a member from the organization'),
  ('members.manage_status', 'Suspend or reactivate a member'),
  ('roles.assign', 'Change a member''s role'),
  ('audit_logs.view', 'View the organization''s audit log');

-- Roles are per-organization (a user's role is per-membership, never global —
-- see docs/decisions/0003-multi-organization-selection.md), which is also what
-- allows a later phase to let an org define custom roles alongside the system ones.
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

comment on table public.roles is 'A named, permissioned role within one organization. is_system marks the seeded Owner/Admin/Member roles.';

create index roles_organization_id_idx on public.roles (organization_id);

create trigger roles_set_updated_at
  before update on public.roles
  for each row
  execute function public.set_updated_at();

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Seed the three system roles for every organization that already exists.
insert into public.roles (organization_id, name, is_system)
select o.id, r.name, true
from public.organizations o
cross join (values ('Owner'), ('Admin'), ('Member')) as r (name);

-- Owner: every permission. Admin: everything except organization settings.
-- Member: nothing (matches the pre-Phase-4 behavior, where only 'owner' could act).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.is_system
  and (r.name = 'Owner' or (r.name = 'Admin' and p.key <> 'organization.manage_settings'));

-- Move memberships/invitations off the text `role` column onto a role_id FK.
alter table public.memberships add column role_id uuid references public.roles (id);
alter table public.invitations add column role_id uuid references public.roles (id);

update public.memberships m
set role_id = r.id
from public.roles r
where r.organization_id = m.organization_id
  and r.is_system
  and lower(r.name) = m.role;

update public.invitations i
set role_id = r.id
from public.roles r
where r.organization_id = i.organization_id
  and r.is_system
  and lower(r.name) = i.role;

alter table public.memberships alter column role_id set not null;
alter table public.invitations alter column role_id set not null;

alter table public.memberships drop column role;
alter table public.invitations drop column role;

create index memberships_role_id_idx on public.memberships (role_id);
create index invitations_role_id_idx on public.invitations (role_id);

-- Seed the new organization's system roles/permissions and put the creator in
-- the Owner role, instead of the old `role = 'owner'` text literal.
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
  if exists (select 1 from public.memberships where user_id = auth.uid()) then
    raise exception 'already_in_organization' using errcode = 'P0001';
  end if;

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

create or replace function public.accept_invitation(p_token uuid)
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invitations;
  v_membership public.memberships;
begin
  select * into v_invite
  from public.invitations
  where token = p_token and status = 'pending'
  for update;

  if not found then
    raise exception 'invitation_not_found' using errcode = 'P0001';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'invitation_expired' using errcode = 'P0001';
  end if;

  if lower(v_invite.email) <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'invitation_email_mismatch' using errcode = 'P0001';
  end if;

  insert into public.memberships (organization_id, user_id, role_id)
  values (v_invite.organization_id, auth.uid(), v_invite.role_id)
  on conflict (organization_id, user_id) do nothing
  returning * into v_membership;

  update public.invitations
  set status = 'accepted', accepted_at = now()
  where id = v_invite.id;

  return v_membership;
end;
$$;

-- role text -> role_name text (joined from roles), now that invitations has no role column.
-- Postgres won't let CREATE OR REPLACE change OUT parameter names/types, so drop first.
drop function if exists public.get_invitation_by_token(uuid);

create function public.get_invitation_by_token(p_token uuid)
returns table (
  email text,
  role_name text,
  status text,
  expires_at timestamptz,
  organization_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select i.email, r.name, i.status, i.expires_at, o.name
  from public.invitations i
  join public.organizations o on o.id = i.organization_id
  join public.roles r on r.id = i.role_id
  where i.token = p_token;
$$;

-- RLS-recursion-safe permission check, same pattern as is_org_member/is_org_owner.
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
      and p.key = p_permission_key
  );
$$;

-- Ownership is no longer a role text literal — it's holding the org's system Owner role.
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
      and r.is_system
      and r.name = 'Owner'
  );
$$;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is 'Minimal audit foundation for later phases to write into. First writer: assign_membership_role(). No viewer UI until Phase 11.';

create index audit_logs_organization_id_idx on public.audit_logs (organization_id);

-- Plain client UPDATEs may only change `status` (see Phase 3's migration comment).
-- Role reassignment gets its own controlled path (assign_membership_role RPC
-- below), which flips this session-local flag so its UPDATE can pass through
-- the same trigger rather than needing a separate bypass mechanism.
create or replace function public.prevent_membership_identity_change()
returns trigger
language plpgsql
as $$
begin
  if new.organization_id is distinct from old.organization_id
    or new.user_id is distinct from old.user_id then
    raise exception 'membership_identity_change_forbidden' using errcode = 'P0001';
  end if;

  if new.role_id is distinct from old.role_id
    and coalesce(current_setting('app.bypass_role_guard', true), 'off') <> 'on' then
    raise exception 'membership_identity_change_forbidden' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create or replace function public.assign_membership_role(p_membership_id uuid, p_role_id uuid)
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_membership public.memberships;
begin
  select organization_id into v_organization_id
  from public.memberships
  where id = p_membership_id;

  if v_organization_id is null then
    raise exception 'membership_not_found' using errcode = 'P0001';
  end if;

  if not public.has_permission(v_organization_id, 'roles.assign') then
    raise exception 'insufficient_permissions' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.roles where id = p_role_id and organization_id = v_organization_id
  ) then
    raise exception 'role_not_found' using errcode = 'P0001';
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

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.audit_logs enable row level security;

create policy "Members can view their organization's roles"
  on public.roles for select
  using (public.is_org_member(organization_id));
-- deliberately no insert/update/delete policy: this phase only ships the
-- seeded system roles, created by create_organization_with_owner().

create policy "Any authenticated user can view the permission catalog"
  on public.permissions for select
  to authenticated
  using (true);

create policy "Members can view their organization's role permissions"
  on public.role_permissions for select
  using (
    exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id and public.is_org_member(r.organization_id)
    )
  );

create policy "Owners and admins can view their organization's audit log"
  on public.audit_logs for select
  using (public.has_permission(organization_id, 'audit_logs.view'));
-- deliberately no insert/update/delete policy: writes go through security
-- definer RPCs only (assign_membership_role() today).

-- Delegable member-management actions now check has_permission() instead of the
-- literal Owner role, so an Admin can act too; is_org_member/is_org_owner stay
-- for checks that are genuinely about membership/ownership, not a permission.
drop policy if exists "Owners can view their organization's invitations" on public.invitations;
create policy "Members with members.invite can view their organization's invitations"
  on public.invitations for select
  using (public.has_permission(organization_id, 'members.invite'));

drop policy if exists "Owners can create invitations for their organization" on public.invitations;
create policy "Members with members.invite can create invitations"
  on public.invitations for insert
  with check (public.has_permission(organization_id, 'members.invite') and invited_by = auth.uid());

drop policy if exists "Owners can update their organization's invitations" on public.invitations;
create policy "Members with members.invite can update their organization's invitations"
  on public.invitations for update
  using (public.has_permission(organization_id, 'members.invite'))
  with check (public.has_permission(organization_id, 'members.invite'));

drop policy if exists "Owners can update memberships in their organization" on public.memberships;
create policy "Members with members.manage_status can update memberships"
  on public.memberships for update
  using (public.has_permission(organization_id, 'members.manage_status'))
  with check (public.has_permission(organization_id, 'members.manage_status'));

drop policy if exists "Owners can remove memberships from their organization" on public.memberships;
create policy "Members with members.remove can remove memberships"
  on public.memberships for delete
  using (public.has_permission(organization_id, 'members.remove'));
