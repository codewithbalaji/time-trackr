-- RLS: role/permission boundaries within a single organization.
--
-- Proves that RBAC permission checks (public.has_permission) are actually
-- enforced by the database, not just hidden in the frontend nav -- see
-- docs/security.md's "Never assume that the frontend is a trusted
-- environment" and docs/testing.md's "Role-based access" / "Permission
-- boundaries" requirements.
--
-- Runs as a single transaction that is rolled back at the end.
begin;

select plan(10);

-- ---------------------------------------------------------------------------
-- Fixtures: one organization with an Owner, an Admin, and a plain Member.
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'owner@pgtap.test', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'admin@pgtap.test', 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'member@pgtap.test', 'authenticated', 'authenticated');

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select (public.create_organization_with_owner('PGTap RBAC Org')).id as org_id \gset
reset request.jwt.claim.sub;

select id as admin_role_id from public.roles where organization_id = :'org_id' and name = 'Admin' \gset
select id as member_role_id from public.roles where organization_id = :'org_id' and name = 'Member' \gset

insert into public.memberships (organization_id, user_id, role_id) values
  (:'org_id', '22222222-2222-2222-2222-222222222222', :'admin_role_id'),
  (:'org_id', '33333333-3333-3333-3333-333333333333', :'member_role_id');

insert into public.projects (id, organization_id, name, created_by)
values ('44444444-4444-4444-4444-444444444444', :'org_id', 'RBAC Project', '11111111-1111-1111-1111-111111111111');

-- Two time entries owned by two different members, for the reviewer-visibility checks.
insert into public.time_entries (id, organization_id, user_id, project_id, description, start_time, end_time)
values
  ('55555555-5555-5555-5555-555555555555', :'org_id', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'Member work', now() - interval '1 hour', now()),
  ('66666666-6666-6666-6666-666666666666', :'org_id', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Admin work', now() - interval '2 hours', now() - interval '1 hour');

insert into public.invitations (organization_id, email, role_id, invited_by)
values (:'org_id', 'someone@pgtap.test', :'member_role_id', '11111111-1111-1111-1111-111111111111');

-- ---------------------------------------------------------------------------
-- clients.manage: a plain Member has it revoked, an Admin has it granted.
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select throws_ok(
  format(
    $$insert into public.clients (organization_id, name, created_by) values (%L, %L, %L)$$,
    :'org_id', 'Member''s Client', '33333333-3333-3333-3333-333333333333'
  ),
  '42501',
  'new row violates row-level security policy for table "clients"',
  'a Member without clients.manage cannot create a client'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select lives_ok(
  format(
    $$insert into public.clients (organization_id, name, created_by) values (%L, %L, %L)$$,
    :'org_id', 'Admin''s Client', '22222222-2222-2222-2222-222222222222'
  ),
  'an Admin with clients.manage can create a client'
);

-- ---------------------------------------------------------------------------
-- organization.manage_settings: only the Owner has it (Admin is explicitly
-- excluded -- see the Phase 4 seed comment "Admin: everything except
-- organization settings").
-- ---------------------------------------------------------------------------

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
update public.organizations set name = 'Hacked By Member' where id = :'org_id';

reset role;
select is(
  (select name from public.organizations where id = :'org_id'),
  'PGTap RBAC Org',
  'a Member without organization.manage_settings cannot rename the organization'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
update public.organizations set name = 'Renamed By Owner' where id = :'org_id';

reset role;
select is(
  (select name from public.organizations where id = :'org_id'),
  'Renamed By Owner',
  'the Owner can rename the organization'
);

-- ---------------------------------------------------------------------------
-- audit_logs.view: granted to Owner/Admin, not to a plain Member.
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select is(
  (select count(*) from public.audit_logs where organization_id = :'org_id')::int, 0,
  'a Member without audit_logs.view cannot see the audit log'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select ok(
  (select count(*) from public.audit_logs where organization_id = :'org_id') > 0,
  'an Admin with audit_logs.view can see the audit log'
);

-- ---------------------------------------------------------------------------
-- timesheets.approve: lets a reviewer read another member's time entries;
-- without it, a member sees only their own.
-- ---------------------------------------------------------------------------

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select is(
  (select count(*) from public.time_entries where id = '66666666-6666-6666-6666-666666666666')::int, 0,
  'a Member without timesheets.approve cannot see another member''s time entries'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select is(
  (select count(*) from public.time_entries where id = '55555555-5555-5555-5555-555555555555')::int, 1,
  'an Admin with timesheets.approve can see another member''s time entries'
);

-- ---------------------------------------------------------------------------
-- members.invite: gates invitation visibility.
-- ---------------------------------------------------------------------------

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select is(
  (select count(*) from public.invitations where organization_id = :'org_id')::int, 0,
  'a Member without members.invite cannot view invitations'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select ok(
  (select count(*) from public.invitations where organization_id = :'org_id') > 0,
  'the Owner can view invitations'
);

reset role;
select * from finish();
rollback;
