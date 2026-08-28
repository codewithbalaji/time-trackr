-- Phase 3: employee directory, membership status, and invite revoke/resend.
-- Closes the gaps explicitly deferred from Phase 2, see
-- docs/decisions/0002-organization-rls-and-invites.md:
-- "Phase 3 (member list, revoke/resend invites) will add update/delete
-- policies to invitations and a membership-scoped select policy to profiles."

-- RLS-recursion-safe check used by the profiles select policy below: mirrors
-- is_org_member/is_org_owner's security definer + fixed search_path pattern
-- (see supabase/migrations/20260827135646_create_organizations.sql).
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
    where mine.user_id = auth.uid() and theirs.user_id = p_user_id
  );
$$;

create policy "Members can view profiles of fellow organization members"
  on public.profiles for select
  using (public.shares_org_with(id));

create policy "Owners can update their organization's invitations"
  on public.invitations for update
  using (public.is_org_owner(organization_id))
  with check (public.is_org_owner(organization_id));
-- Covers both revoke (set status = 'revoked') and resend (bump expires_at)
-- from the client under plain RLS; no RPC needed since it's a single-table write.

alter table public.memberships
  add column status text not null default 'active' check (status in ('active', 'suspended'));

comment on column public.memberships.status is
  'Whether the member can currently access the organization. A plain check constraint, matching the role column''s convention.';

-- Plain client updates may only change `status`. Role/organization/user
-- reassignment stays out of reach of a direct update statement, the same way
-- membership creation stays out of reach of a direct insert statement — role
-- management gets its own controlled path in Phase 4.
create or replace function public.prevent_membership_identity_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
    or new.organization_id is distinct from old.organization_id
    or new.user_id is distinct from old.user_id then
    raise exception 'membership_identity_change_forbidden' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger memberships_prevent_identity_change
  before update on public.memberships
  for each row
  execute function public.prevent_membership_identity_change();

create policy "Owners can update memberships in their organization"
  on public.memberships for update
  using (public.is_org_owner(organization_id))
  with check (public.is_org_owner(organization_id));

create policy "Owners can remove memberships from their organization"
  on public.memberships for delete
  using (public.is_org_owner(organization_id));
