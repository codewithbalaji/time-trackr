-- Phase 2: organizations, membership, and a basic invite mechanism.
-- See docs/decisions/0002-organization-rls-and-invites.md for the reasoning behind
-- the RLS-recursion-safe helper functions and the RPC-vs-plain-RLS-insert split below.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.organizations is 'A tenant. Application data is owned by an organization, not directly by a user.';

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row
  execute function public.set_updated_at();

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

comment on table public.memberships is 'A user''s membership in an organization. Role is a plain check constraint (not an enum) so Phase 4 RBAC can extend the role set without ALTER TYPE friction.';

create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_organization_id_idx on public.memberships (organization_id);

create trigger memberships_set_updated_at
  before update on public.memberships
  for each row
  execute function public.set_updated_at();

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role text not null default 'member' check (role in ('owner', 'member')),
  token uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid not null references auth.users (id) on delete restrict,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.invitations is 'A pending offer to join an organization. Accepted via the accept_invitation() RPC, which creates the membership.';

create unique index invitations_token_key on public.invitations (token);
create index invitations_organization_id_idx on public.invitations (organization_id);
create index invitations_email_idx on public.invitations (lower(email));

-- one active (pending) invite per email per organization
create unique index invitations_pending_org_email_key
  on public.invitations (organization_id, lower(email))
  where status = 'pending';

create trigger invitations_set_updated_at
  before update on public.invitations
  for each row
  execute function public.set_updated_at();

-- RLS-recursion-safe membership checks.
-- A policy on `memberships` cannot safely subquery `memberships` directly (it would
-- re-trigger its own RLS and recurse). Wrapping the check in a security definer
-- function with a fixed search_path (same pattern as handle_new_user) lets the
-- function read `memberships` without RLS re-applying to its own subquery.
create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = p_organization_id and m.user_id = auth.uid()
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
    select 1 from public.memberships m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

-- Write paths that touch more than one table go through security definer RPCs so
-- the writes are atomic and the client never inserts into organizations/memberships
-- directly. Single-table writes (creating an invitation) use plain RLS instead.

create or replace function public.create_organization_with_owner(p_name text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.organizations;
begin
  if exists (select 1 from public.memberships where user_id = auth.uid()) then
    raise exception 'already_in_organization' using errcode = 'P0001';
  end if;

  insert into public.organizations (name, created_by)
  values (p_name, auth.uid())
  returning * into v_org;

  insert into public.memberships (organization_id, user_id, role)
  values (v_org.id, auth.uid(), 'owner');

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

  insert into public.memberships (organization_id, user_id, role)
  values (v_invite.organization_id, auth.uid(), v_invite.role)
  on conflict (organization_id, user_id) do nothing
  returning * into v_membership;

  update public.invitations
  set status = 'accepted', accepted_at = now()
  where id = v_invite.id;

  return v_membership;
end;
$$;

-- Lets an authenticated invitee preview the organization name/email before joining,
-- even though they aren't a member yet (so plain RLS on organizations wouldn't allow
-- them to read it). Returns only the columns needed for that preview, not the row.
create or replace function public.get_invitation_by_token(p_token uuid)
returns table (
  email text,
  role text,
  status text,
  expires_at timestamptz,
  organization_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select i.email, i.role, i.status, i.expires_at, o.name
  from public.invitations i
  join public.organizations o on o.id = i.organization_id
  where i.token = p_token;
$$;

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;

create policy "Members can view their organization"
  on public.organizations for select
  using (public.is_org_member(id));
-- deliberately no insert/update/delete policy: writes go through
-- create_organization_with_owner(), which is security definer.

create policy "Members can view fellow memberships in their org"
  on public.memberships for select
  using (public.is_org_member(organization_id));
-- deliberately no insert/update/delete policy: writes go through
-- create_organization_with_owner() / accept_invitation().

create policy "Owners can view their organization's invitations"
  on public.invitations for select
  using (public.is_org_owner(organization_id));

create policy "Owners can create invitations for their organization"
  on public.invitations for insert
  with check (public.is_org_owner(organization_id) and invited_by = auth.uid());
-- deliberately no update/delete policy: acceptance is handled by accept_invitation();
-- revoke/resend (Phase 3) will add an owner-scoped update policy then.

-- profiles RLS is intentionally left unchanged here (still self-scoped, auth.uid() = id).
-- Phase 2's flows never need to read another member's profile; Phase 3's member list
-- will need to revisit this. See docs/decisions/0002-organization-rls-and-invites.md.
