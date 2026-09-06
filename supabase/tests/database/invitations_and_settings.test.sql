-- accept_invitation's guard rails, plus the organization/profile identity
-- triggers and the organizations UPDATE policy.
--
-- accept_invitation had no database test at all, which is why nothing caught
-- that the pending-invitations RPC was handing out expired invitations for
-- this function to then reject. See docs/testing.md's "Database and Security
-- Tests" section.
--
-- Note the use of `request.jwt.claims` (the whole JSON blob) rather than the
-- per-claim `request.jwt.claim.sub` the other tests here use: auth.uid() reads
-- either, but auth.jwt() -- which accept_invitation matches the invited address
-- against -- only reads the blob.
--
-- Runs as a single transaction that is rolled back at the end, so it needs no
-- separate cleanup and leaves no fixture data behind.
begin;

select plan(14);

-- ---------------------------------------------------------------------------
-- Fixtures: one organization with an owner, plus three invitees -- one live
-- invitation, one expired, and one addressed to somebody else.
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, aud, role) values
  ('a0000000-0000-0000-0000-00000000000a', 'owner@pgtap.test', 'authenticated', 'authenticated'),
  ('a0000000-0000-0000-0000-00000000000b', 'invitee@pgtap.test', 'authenticated', 'authenticated'),
  ('a0000000-0000-0000-0000-00000000000c', 'expired@pgtap.test', 'authenticated', 'authenticated'),
  ('a0000000-0000-0000-0000-00000000000d', 'stranger@pgtap.test', 'authenticated', 'authenticated');

set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-00000000000a","email":"owner@pgtap.test"}';
select (public.create_organization_with_owner('PGTap Org', 'Europe/London')).id as org_id \gset
reset request.jwt.claims;

select is(
  (select timezone from public.organizations where id = :'org_id'), 'Europe/London',
  'create_organization_with_owner stores the timezone it is given'
);

select id as member_role_id from public.roles
  where organization_id = :'org_id' and name = 'Member' \gset

insert into public.invitations (organization_id, email, role_id, invited_by, token)
values (:'org_id', 'invitee@pgtap.test', :'member_role_id', 'a0000000-0000-0000-0000-00000000000a',
        '11111111-1111-1111-1111-111111111111');

insert into public.invitations (organization_id, email, role_id, invited_by, token, expires_at)
values (:'org_id', 'expired@pgtap.test', :'member_role_id', 'a0000000-0000-0000-0000-00000000000a',
        '22222222-2222-2222-2222-222222222222', now() - interval '1 day');

-- ---------------------------------------------------------------------------
-- accept_invitation
-- ---------------------------------------------------------------------------

set local role authenticated;

-- Wrong recipient: possessing the token must not be enough.
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-00000000000d","email":"stranger@pgtap.test"}';
select throws_ok(
  $q$ select public.accept_invitation('11111111-1111-1111-1111-111111111111') $q$,
  'invitation_email_mismatch',
  'accept_invitation refuses a token presented by a different address'
);

-- Expired: rejected even though the row is still status = 'pending'. Nothing
-- sweeps expired invitations, so 'pending' never stops being true on its own.
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-00000000000c","email":"expired@pgtap.test"}';
select throws_ok(
  $q$ select public.accept_invitation('22222222-2222-2222-2222-222222222222') $q$,
  'invitation_expired',
  'accept_invitation refuses an expired invitation'
);

-- ...and the pending-invitations RPC must not have offered it in the first
-- place. That mismatch is what the client showed as an Accept button which
-- always failed.
select is(
  (select count(*) from public.get_pending_invitations_for_current_user())::int, 0,
  'get_pending_invitations_for_current_user hides expired invitations'
);

select throws_ok(
  $q$ select public.accept_invitation('33333333-3333-3333-3333-333333333333') $q$,
  'invitation_not_found',
  'accept_invitation refuses an unknown token'
);

-- The happy path, and the fact that it is listed beforehand.
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-00000000000b","email":"invitee@pgtap.test"}';

select is(
  (select count(*) from public.get_pending_invitations_for_current_user())::int, 1,
  'get_pending_invitations_for_current_user lists a live invitation'
);

select lives_ok(
  $q$ select public.accept_invitation('11111111-1111-1111-1111-111111111111') $q$,
  'accept_invitation admits the invited address'
);

select is(
  (select status from public.invitations where token = '11111111-1111-1111-1111-111111111111'),
  'accepted',
  'accept_invitation marks the invitation accepted'
);

-- Replaying the same token must not create a second membership. The emailed
-- link is now idempotent by design (mail scanners pre-fetch it), so a repeat
-- visit is expected rather than exceptional.
select throws_ok(
  $q$ select public.accept_invitation('11111111-1111-1111-1111-111111111111') $q$,
  'invitation_not_found',
  'accept_invitation cannot be replayed once accepted'
);

select is(
  (select count(*) from public.memberships
    where organization_id = :'org_id'
      and user_id = 'a0000000-0000-0000-0000-00000000000b')::int,
  1,
  'accept_invitation creates exactly one membership'
);

-- ---------------------------------------------------------------------------
-- Organization settings: writable by the owner, not by a plain member, and
-- never able to change the row's identity.
-- ---------------------------------------------------------------------------

-- The invitee is now a Member, which has no organization.manage_settings.
-- Under RLS that is a refusal matching zero rows rather than an error -- which
-- is exactly why the client has to read its writes back.
update public.organizations set name = 'Renamed By Member' where id = :'org_id';
select is(
  (select name from public.organizations where id = :'org_id'), 'PGTap Org',
  'a member without organization.manage_settings cannot rename the organization'
);

-- A member cannot rewrite their own email out from under the invitation
-- matching either.
select throws_ok(
  $q$ update public.profiles set email = 'someone.else@pgtap.test'
      where id = 'a0000000-0000-0000-0000-00000000000b' $q$,
  'profile_identity_change_forbidden',
  'the profiles UPDATE policy cannot be used to change email'
);

set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-00000000000a","email":"owner@pgtap.test"}';
update public.organizations set name = 'Renamed By Owner' where id = :'org_id';
select is(
  (select name from public.organizations where id = :'org_id'), 'Renamed By Owner',
  'an owner can rename the organization'
);

-- ...but not re-point it at somebody else.
select throws_ok(
  $q$ update public.organizations
      set created_by = 'a0000000-0000-0000-0000-00000000000b'
      where name = 'Renamed By Owner' $q$,
  'organization_identity_change_forbidden',
  'the organizations UPDATE policy cannot be used to change created_by'
);

select * from finish();
rollback;
