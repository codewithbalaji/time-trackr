-- Phase 5: clients, projects, project membership (assignment), and a generic
-- audit trigger. Every write here is single-table, so (per ADR-0002's
-- RPC-vs-plain-RLS rule) plain RLS policies are used throughout instead of
-- security-definer RPCs.

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

comment on table public.clients is 'Minimal client record: a label to group projects under, not a CRM.';

create index clients_organization_id_idx on public.clients (organization_id);

create trigger clients_set_updated_at
  before update on public.clients
  for each row
  execute function public.set_updated_at();

-- No delete path for clients/projects: archiving (status = 'archived') is the
-- only lifecycle-removal action. Hard delete is deliberately left out because
-- Phase 6 will add time_entries.project_id, and we don't want to have decided
-- (by omission) what happens to historical time entries on project deletion.
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 120),
  color text not null default '#3B82F6' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create index projects_organization_id_idx on public.projects (organization_id);
create index projects_client_id_idx on public.projects (client_id);
create index projects_status_idx on public.projects (organization_id, status);

create trigger projects_set_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

-- Assignment table. Visibility of projects/clients is open to all org members
-- in this phase (see ADR-0005), so this table doesn't gate access today — it
-- exists for later phases (e.g. Phase 6's "my projects" filtering).
create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index project_members_project_id_idx on public.project_members (project_id);
create index project_members_user_id_idx on public.project_members (user_id);

-- Permissions: extends the Phase 4 catalog. No changes needed to
-- create_organization_with_owner() — it already cross-joins *all* permissions
-- for Owner and everything except organization.manage_settings for Admin, so
-- new orgs pick these up automatically. Existing orgs need a backfill.
insert into public.permissions (key, description) values
  ('clients.manage', 'Create, edit, and archive clients'),
  ('projects.manage', 'Create, edit, archive, and manage members of projects');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.is_system
  and p.key in ('clients.manage', 'projects.manage')
  and r.name in ('Owner', 'Admin')
on conflict (role_id, permission_id) do nothing;

alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;

-- clients: view is open to any org member (matches the `roles` table's own
-- select policy); only clients.manage can write.
create policy "Members can view their organization's clients"
  on public.clients for select
  using (public.is_org_member(organization_id));

create policy "Members with clients.manage can create clients"
  on public.clients for insert
  with check (public.has_permission(organization_id, 'clients.manage') and created_by = auth.uid());

create policy "Members with clients.manage can update clients"
  on public.clients for update
  using (public.has_permission(organization_id, 'clients.manage'))
  with check (public.has_permission(organization_id, 'clients.manage'));

-- projects: same open-view / permission-gated-write shape as clients.
create policy "Members can view their organization's projects"
  on public.projects for select
  using (public.is_org_member(organization_id));

create policy "Members with projects.manage can create projects"
  on public.projects for insert
  with check (public.has_permission(organization_id, 'projects.manage') and created_by = auth.uid());

create policy "Members with projects.manage can update projects"
  on public.projects for update
  using (public.has_permission(organization_id, 'projects.manage'))
  with check (public.has_permission(organization_id, 'projects.manage'));

-- project_members: view follows the parent project's org membership. Writes
-- require projects.manage *and* (on insert) that the assignee is an active
-- member of the same organization as the project — otherwise a caller with
-- projects.manage in org A could assign a user from org B.
create policy "Members can view their organization's project assignments"
  on public.project_members for select
  using (exists (
    select 1 from public.projects p
    where p.id = project_members.project_id and public.is_org_member(p.organization_id)
  ));

create policy "Members with projects.manage can assign project members"
  on public.project_members for insert
  with check (exists (
    select 1 from public.projects p
    join public.memberships m on m.organization_id = p.organization_id
    where p.id = project_members.project_id
      and public.has_permission(p.organization_id, 'projects.manage')
      and m.user_id = project_members.user_id
      and m.status = 'active'
  ));

create policy "Members with projects.manage can remove project members"
  on public.project_members for delete
  using (exists (
    select 1 from public.projects p
    where p.id = project_members.project_id and public.has_permission(p.organization_id, 'projects.manage')
  ));

-- Generic audit trigger: unlike Phase 4's assign_membership_role(), these
-- writes are plain RLS (no RPC) so there's no security-definer function body
-- to embed a manual `insert into audit_logs` in. This trigger fills that role
-- for any table with an `id` column plus either an `organization_id` column
-- or (for project_members) a resolvable path to one. See ADR-0005.
create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_action text;
begin
  if tg_op = 'INSERT' then
    v_action := tg_table_name || '_created';
  elsif tg_op = 'UPDATE' then
    v_action := tg_table_name || '_updated';
  else
    v_action := tg_table_name || '_deleted';
  end if;

  -- new/old are typed per the specific table a given trigger fires on, and
  -- clients/projects/project_members don't share the same columns (only
  -- project_members lacks organization_id) — direct field access
  -- (new.organization_id) would raise "record has no field ..." on whichever
  -- table doesn't have that column, so extract through jsonb instead, which
  -- safely returns null for a missing key rather than erroring.
  v_organization_id := coalesce(
    (to_jsonb(new) ->> 'organization_id')::uuid,
    (to_jsonb(old) ->> 'organization_id')::uuid
  );
  if v_organization_id is null then
    select p.organization_id into v_organization_id
    from public.projects p
    where p.id = coalesce(
      (to_jsonb(new) ->> 'project_id')::uuid,
      (to_jsonb(old) ->> 'project_id')::uuid
    );
  end if;

  insert into public.audit_logs (organization_id, actor_id, action, target_type, target_id, metadata)
  values (
    v_organization_id,
    auth.uid(),
    v_action,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );

  return coalesce(new, old);
end;
$$;

create trigger clients_audit_log
  after insert or update or delete on public.clients
  for each row execute function public.log_audit_event();

create trigger projects_audit_log
  after insert or update or delete on public.projects
  for each row execute function public.log_audit_event();

create trigger project_members_audit_log
  after insert or update or delete on public.project_members
  for each row execute function public.log_audit_event();
