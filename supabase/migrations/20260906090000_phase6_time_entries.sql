-- Phase 6: time entries. Each entry is a single piece of tracked work — a
-- required project, a free-text description of what was worked on, and a
-- start/end time (end_time null while the timer is running). No tasks table:
-- the description field covers "what was worked on" per the product decision
-- for this phase.

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid not null references public.projects (id),
  description text not null check (char_length(trim(description)) between 1 and 500),
  start_time timestamptz not null,
  end_time timestamptz,
  duration_seconds integer generated always as (
    extract(epoch from (end_time - start_time))::integer
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint time_entries_end_after_start check (end_time is null or end_time > start_time)
);

comment on table public.time_entries is 'A single piece of tracked work: a required project, a free-text description, and a start/end time. end_time is null while the timer is running.';

-- Only one running (unfinished) entry per user at a time.
create unique index time_entries_one_running_per_user
  on public.time_entries (user_id)
  where end_time is null;

create index time_entries_organization_id_idx on public.time_entries (organization_id);
create index time_entries_user_id_start_time_idx on public.time_entries (user_id, start_time desc);
create index time_entries_project_id_idx on public.time_entries (project_id);

create trigger time_entries_set_updated_at
  before update on public.time_entries
  for each row
  execute function public.set_updated_at();

-- Data integrity: the selected project must belong to the same organization
-- as the entry. The frontend only ever offers the current org's projects,
-- but this guarantees it at the database level too (see docs/database.md's
-- "Database Logic" rule).
create or replace function public.check_time_entry_project_org()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.projects
    where id = new.project_id and organization_id = new.organization_id
  ) then
    raise exception 'project does not belong to the entry''s organization';
  end if;
  return new;
end;
$$;

create trigger time_entries_project_org_check
  before insert or update on public.time_entries
  for each row
  execute function public.check_time_entry_project_org();

-- Atomically stops any currently-running entry for the caller before starting
-- a new one, so a "start" action can never leave two running rows (the
-- unique index above would reject that anyway, but this avoids a client-side
-- race + retry). Not security definer: it runs as the calling user, so the
-- RLS policies below still apply to both statements inside it.
create or replace function public.start_time_entry(
  p_organization_id uuid,
  p_project_id uuid,
  p_description text
) returns public.time_entries
language plpgsql
as $$
declare
  v_entry public.time_entries;
begin
  update public.time_entries
    set end_time = now()
    where user_id = auth.uid()
      and organization_id = p_organization_id
      and end_time is null;

  insert into public.time_entries (organization_id, user_id, project_id, description, start_time)
  values (p_organization_id, auth.uid(), p_project_id, p_description, now())
  returning * into v_entry;

  return v_entry;
end;
$$;

grant execute on function public.start_time_entry(uuid, uuid, text) to authenticated;

alter table public.time_entries enable row level security;

-- Own entries only, scoped to organization membership. Team/manager
-- visibility of other members' time is a Phase 7/8 (timesheets/approvals)
-- concern, not part of this phase.
create policy "Members can view their own time entries"
  on public.time_entries for select
  using (user_id = auth.uid() and public.is_org_member(organization_id));

create policy "Members can create their own time entries"
  on public.time_entries for insert
  with check (user_id = auth.uid() and public.is_org_member(organization_id));

create policy "Members can update their own time entries"
  on public.time_entries for update
  using (user_id = auth.uid() and public.is_org_member(organization_id))
  with check (user_id = auth.uid() and public.is_org_member(organization_id));

create policy "Members can delete their own time entries"
  on public.time_entries for delete
  using (user_id = auth.uid() and public.is_org_member(organization_id));

create trigger time_entries_audit_log
  after insert or update or delete on public.time_entries
  for each row execute function public.log_audit_event();
