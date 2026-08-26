# ADR-0001: Public profiles table synced via database trigger

## Status

Accepted

## Context

Supabase Auth owns `auth.users`, which holds credentials and auth metadata but is not designed to be queried directly from application code or extended with app-specific columns. Phase 1 (Authentication) needs somewhere to store application-facing identity data (currently just `full_name`, alongside a denormalized `email`), and later phases (3: Users/Employees, 2: Organizations) will need to attach more — role, status, organization membership, etc.

Two options were considered for creating the row that backs a new user's profile:
1. Have the frontend insert a `profiles` row as a follow-up call after `supabase.auth.signUp()` succeeds.
2. Have a Postgres trigger on `auth.users` insert create the `profiles` row automatically.

Option 1 leaves a window where an auth user exists but the frontend's follow-up insert fails (network error, tab closed, thrown exception) or is skipped by a different signup path (e.g. a future admin-invite flow in Phase 2/3), leaving an orphaned auth user with no profile.

## Decision

Create a minimal `public.profiles` table now (`id uuid primary key references auth.users(id) on delete cascade`, `email`, `full_name`, timestamps), populated by a `security definer` trigger function (`handle_new_user`) on `auth.users` insert, with `updated_at` kept current by a second `before update` trigger. Row Level Security is enabled immediately, with `select`/`update` policies scoped to `auth.uid() = id` — no `insert`/`delete` policy, since rows are only ever created by the trigger and removed via the `auth.users` cascade.

This keeps profile creation atomic with account creation regardless of which code path creates the auth user, and establishes a baseline PII protection boundary now rather than leaving `profiles` fully open until Phase 4's RLS work.

## Consequences

- Any future signup path (invites, admin-created users, etc.) automatically gets a profile row for free — no application code needs to remember to create one.
- Phase 2/3 can extend `profiles` with additional columns (e.g. `organization_id`, `status`) via new migrations without touching the trigger, as long as those columns are nullable or have defaults compatible with the existing insert.
- The trigger function is the one place that must be updated if the set of fields copied from `auth.users`/`raw_user_meta_data` at signup time changes.
- Full authorization design (roles, org-scoped RLS) is still deferred to Phase 2/4; the current RLS policies only guarantee self-access and should be revisited once organization membership exists.
