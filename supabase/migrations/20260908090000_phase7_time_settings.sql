-- Phase 7 follow-up: organization-level Time Settings (Clockify-style) —
-- date format, time format, and day start alongside the timezone added in
-- 20260907090000. Stored for consistent display across Time Tracker and
-- Timesheets (Reports will follow the same convention once it exists in
-- Phase 9). day_start is stored only — it does not yet shift day/week
-- boundaries in check_time_entry_not_locked()/submit_timesheet(); wiring
-- that in is a deliberately deferred follow-up, not an oversight.

alter table public.organizations
  add column date_format text not null default 'MM/DD/YYYY'
    check (date_format in ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')),
  add column time_format text not null default '24h'
    check (time_format in ('12h', '24h')),
  add column day_start time not null default '00:00';

-- Bug fix: organizations has never had an UPDATE policy (only the SELECT
-- policy from 20260827135646/20260902090000), so the timezone update added
-- in the previous round of Phase 7 work has been silently rejected by RLS.
-- Gated by the same permission as the Settings page route.
create policy "Members with organization.manage_settings can update their organization"
  on public.organizations for update
  using (public.has_permission(id, 'organization.manage_settings'))
  with check (public.has_permission(id, 'organization.manage_settings'));
