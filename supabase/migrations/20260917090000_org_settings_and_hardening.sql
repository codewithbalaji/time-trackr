-- Organization settings fixes plus the RLS/function hardening that the
-- Supabase advisors have been flagging.

-- ---------------------------------------------------------------------------
-- 1. Let an organization be created with the creator's timezone.
--
-- Every organization was created at the 'UTC' column default, and the Settings
-- form papered over that by *displaying* the browser's timezone whenever the
-- stored value was 'UTC'. That prefill couldn't be saved (it doesn't mark the
-- form dirty, and Save is disabled until it is), so the screen showed a
-- timezone the application was not actually using. Capturing it at creation
-- time removes the lie at its source; the prefill is gone from the client.
--
-- p_timezone is defaulted so existing callers keep working. Validation is left
-- to the validate_organization_timezone trigger, which already rejects
-- anything Postgres doesn't recognise.
create or replace function public.create_organization_with_owner(
  p_name text,
  p_timezone text default 'UTC'
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.organizations;
  v_owner_role_id uuid;
begin
  insert into public.organizations (name, created_by, timezone)
  values (trim(p_name), auth.uid(), coalesce(nullif(trim(p_timezone), ''), 'UTC'))
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

-- The two-argument signature replaces the one-argument one; dropping it keeps
-- PostgREST from having to disambiguate an overload.
drop function if exists public.create_organization_with_owner(text);

-- ---------------------------------------------------------------------------
-- 2. Organizations can be renamed, but not re-identified.
--
-- The UPDATE policy added in 20260908090000 has no column restriction, so
-- anyone holding organization.manage_settings could PATCH id or created_by
-- through PostgREST alongside the settings they were meant to change. The
-- memberships table already guards this with a trigger
-- (prevent_membership_identity_change); this is the same idea.
create or replace function public.prevent_organization_identity_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id or new.created_by is distinct from old.created_by then
    raise exception 'organization_identity_change_forbidden';
  end if;
  return new;
end;
$$;

drop trigger if exists organizations_prevent_identity_change on public.organizations;
create trigger organizations_prevent_identity_change
  before update on public.organizations
  for each row execute function public.prevent_organization_identity_change();

-- Same reasoning for profiles: its UPDATE policy is "your own row", with no
-- column list, so a client could rewrite profiles.email and desync it from
-- auth.users.email — which is the address invitations are matched against.
create or replace function public.prevent_profile_identity_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id or new.email is distinct from old.email then
    raise exception 'profile_identity_change_forbidden';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_identity_change on public.profiles;
create trigger profiles_prevent_identity_change
  before update on public.profiles
  for each row execute function public.prevent_profile_identity_change();

-- ---------------------------------------------------------------------------
-- 3. Advisor: anon_security_definer_function_executable.
--
-- Every one of these RPCs derives its answer from auth.uid() or auth.jwt(),
-- so an anonymous caller can only ever get an empty/false result or an error —
-- but they shouldn't be callable unauthenticated in the first place, and the
-- advisor is right to say so.
do $$
declare
  v_signature text;
begin
  foreach v_signature in array array[
    'public.accept_invitation(uuid)',
    'public.approve_timesheet(uuid, uuid, date)',
    'public.assign_membership_role(uuid, uuid)',
    'public.can_manage_target_membership(uuid)',
    'public.create_organization_with_owner(text, text)',
    'public.decline_invitation(uuid)',
    'public.get_invitation_by_token(uuid)',
    'public.get_pending_invitations_for_current_user()',
    'public.has_any_membership(uuid)',
    'public.has_permission(uuid, text)',
    'public.is_org_member(uuid)',
    'public.is_org_owner(uuid)',
    'public.reject_timesheet(uuid, uuid, date, text)',
    'public.resubmit_timesheet(uuid, date)',
    'public.shares_org_with(uuid)',
    'public.submit_timesheet(uuid, date)'
  ] loop
    execute format('revoke execute on function %s from anon', v_signature);
  end loop;
end;
$$;

-- handle_new_user and log_audit_event are trigger functions: they're never
-- meant to be called over the API by anyone.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.log_audit_event() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Advisor: function_search_path_mutable.
--
-- A SECURITY DEFINER function without a pinned search_path resolves unqualified
-- names against the caller's, which is how a definer function gets tricked into
-- running someone else's table or operator. Pinning it is a no-op for these
-- (they already schema-qualify) and closes the hole.
-- Pinned to `public` rather than `''` because these are SECURITY INVOKER and
-- their bodies use unqualified names; `public` is what every definer function
-- in this schema already pins to, and it's equally non-mutable.
alter function public.check_time_entry_project_org() set search_path = public;
alter function public.check_time_entry_not_locked() set search_path = public;
alter function public.is_time_entry_period_locked(uuid, uuid, timestamptz) set search_path = public;
alter function public.prevent_membership_identity_change() set search_path = public;
alter function public.set_updated_at() set search_path = public;
alter function public.validate_organization_timezone() set search_path = public;
alter function public.start_time_entry(uuid, uuid, text) set search_path = public;
alter function public.withdraw_timesheet(uuid, date) set search_path = public;
