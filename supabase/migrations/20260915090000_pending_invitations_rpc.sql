-- Fixes listPendingInvitationsForCurrentUser silently returning nothing for
-- an invitee who isn't yet a member of the inviting organization. The
-- previous approach was a plain `invitations` select with PostgREST embeds
-- (`role:roles(name)`, `organization:organizations(name)`) — but embeds
-- still need RLS SELECT access to the embedded tables themselves, and
-- organizations/roles are both scoped to has_any_membership(), which an
-- invitee doesn't have yet. PostgREST then returns those embeds as null,
-- and the client's `row.role.name` throws on null, failing the whole query
-- with no visible error (see docs on get_invitation_by_token, which already
-- solves the equivalent single-invitation problem the same way).
create or replace function public.get_pending_invitations_for_current_user()
returns table (
  id uuid,
  token uuid,
  expires_at timestamptz,
  role_name text,
  organization_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select i.id, i.token, i.expires_at, r.name, o.name
  from public.invitations i
  join public.roles r on r.id = i.role_id
  join public.organizations o on o.id = i.organization_id
  where i.status = 'pending'
    and lower(i.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  order by i.created_at asc;
$$;
