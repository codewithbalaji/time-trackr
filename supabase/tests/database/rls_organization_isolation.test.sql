-- RLS: cross-organization data isolation.
--
-- Every table below is scoped to an organization (or, for notifications, to a
-- single recipient). This test proves that a member of one organization gets
-- zero rows when querying another organization's data, under the real
-- `authenticated` role and the real RLS policies -- not a mocked client. See
-- docs/testing.md's "Database and Security Tests" section.
--
-- Runs as a single transaction that is rolled back at the end, so it needs no
-- separate cleanup and leaves no fixture data behind.
begin;

select plan(11);

-- ---------------------------------------------------------------------------
-- Fixtures: two organizations, each with an owner. Org A additionally gets a
-- plain Member, plus one row in every org-scoped table so there is something
-- for Org B's owner to wrongly see if isolation is broken.
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, aud, role) values
  ('a0000000-0000-0000-0000-00000000000a', 'owner-a@pgtap.test', 'authenticated', 'authenticated'),
  ('a0000000-0000-0000-0000-00000000000b', 'member-a@pgtap.test', 'authenticated', 'authenticated'),
  ('b0000000-0000-0000-0000-00000000000a', 'owner-b@pgtap.test', 'authenticated', 'authenticated');

set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select (public.create_organization_with_owner('PGTap Org A')).id as org_a_id \gset

set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000a';
select (public.create_organization_with_owner('PGTap Org B')).id as org_b_id \gset

reset request.jwt.claim.sub;

select id as org_a_member_role_id from public.roles
  where organization_id = :'org_a_id' and name = 'Member' \gset

insert into public.memberships (organization_id, user_id, role_id)
values (:'org_a_id', 'a0000000-0000-0000-0000-00000000000b', :'org_a_member_role_id');

insert into public.clients (id, organization_id, name, created_by)
values ('c0000000-0000-0000-0000-00000000000a', :'org_a_id', 'Org A Client', 'a0000000-0000-0000-0000-00000000000a');

insert into public.projects (id, organization_id, client_id, name, created_by)
values ('d0000000-0000-0000-0000-00000000000a', :'org_a_id', 'c0000000-0000-0000-0000-00000000000a', 'Org A Project', 'a0000000-0000-0000-0000-00000000000a');

insert into public.time_entries (id, organization_id, user_id, project_id, description, start_time, end_time)
values ('e0000000-0000-0000-0000-00000000000a', :'org_a_id', 'a0000000-0000-0000-0000-00000000000a', 'd0000000-0000-0000-0000-00000000000a', 'Org A work', now() - interval '1 hour', now());

insert into public.timesheets (id, organization_id, user_id, period_start, period_end)
values ('f0000000-0000-0000-0000-00000000000a', :'org_a_id', 'a0000000-0000-0000-0000-00000000000a', date_trunc('week', now())::date, date_trunc('week', now())::date + 6);

insert into public.invitations (organization_id, email, role_id, invited_by)
values (:'org_a_id', 'invitee@pgtap.test', :'org_a_member_role_id', 'a0000000-0000-0000-0000-00000000000a');

select public.create_notification(
  :'org_a_id', 'a0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-00000000000a',
  'timesheet_submitted', 'timesheets', 'f0000000-0000-0000-0000-00000000000a',
  '/timesheets', 'Org A notification', null
);

-- ---------------------------------------------------------------------------
-- Assertions, as Org B's owner (has no membership in Org A at all).
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000a';

select is(
  (select count(*) from public.organizations where id = :'org_a_id')::int, 0,
  'cannot see another org''s organization row'
);

select is(
  (select count(*) from public.memberships where organization_id = :'org_a_id')::int, 0,
  'cannot see another org''s memberships'
);

select is(
  (select count(*) from public.roles where organization_id = :'org_a_id')::int, 0,
  'cannot see another org''s roles'
);

select is(
  (select count(*) from public.clients where organization_id = :'org_a_id')::int, 0,
  'cannot see another org''s clients'
);

select is(
  (select count(*) from public.projects where organization_id = :'org_a_id')::int, 0,
  'cannot see another org''s projects'
);

select is(
  (select count(*) from public.time_entries where organization_id = :'org_a_id')::int, 0,
  'cannot see another org''s time entries'
);

select is(
  (select count(*) from public.timesheets where organization_id = :'org_a_id')::int, 0,
  'cannot see another org''s timesheets'
);

select is(
  (select count(*) from public.invitations where organization_id = :'org_a_id')::int, 0,
  'cannot see another org''s invitations'
);

select is(
  (select count(*) from public.audit_logs where organization_id = :'org_a_id')::int, 0,
  'cannot see another org''s audit log (no audit_logs.view permission there)'
);

select is(
  (select count(*) from public.notifications where organization_id = :'org_a_id')::int, 0,
  'cannot see another org''s notifications (not the recipient)'
);

-- Sanity check: isolation isn't just "sees nothing" -- confirm the same
-- session can see its own organization.
select is(
  (select count(*) from public.organizations where id = :'org_b_id')::int, 1,
  'can see its own organization'
);

select * from finish();
rollback;
