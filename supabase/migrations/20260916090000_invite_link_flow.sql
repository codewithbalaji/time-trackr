-- Invitation links are now the app's own /invite/accept?token=<invitations.token>
-- URL rather than GoTrue's single-use verification link (see
-- supabase/functions/send-invite-email/index.ts for why). Two DB-side
-- consequences follow.

-- 1. Expired invitations must not be offered for acceptance.
--
-- The RPC filtered on status alone, so /select-organization rendered an Accept
-- button for an invitation whose expires_at had already passed; clicking it
-- always failed inside accept_invitation with `invitation_expired`. There is no
-- expiry sweep job, so `status` stays 'pending' forever — the expiry check has
-- to live in the read.
--
-- get_invitation_by_token deliberately keeps returning expired rows: it backs
-- the invite landing page, which needs to tell "expired, ask for a resend"
-- apart from "no such invitation" and already returns expires_at for exactly
-- that purpose.
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
    and i.expires_at > now()
    and lower(i.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  order by i.created_at asc;
$$;

-- 2. Clear the stale invitation_token stamped into user_metadata.
--
-- The old Edge Function passed `data: { invitation_token }` to
-- inviteUserByEmail, and nothing ever removed it. AuthCallbackPage keyed "is
-- this an invite?" off the mere presence of that field, so once a user had
-- accepted an invitation, every subsequent email link (confirmation, magic
-- link) routed them to /invite/accept, which looked up the long-since-accepted
-- token and dead-ended on "This invitation is invalid". Live users were sitting
-- in exactly that state.
--
-- The client no longer reads this field at all — the token comes from the URL —
-- so this is a one-off cleanup of data the app has stopped writing.
update auth.users
set raw_user_meta_data = raw_user_meta_data - 'invitation_token'
where raw_user_meta_data ? 'invitation_token';
