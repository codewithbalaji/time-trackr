# ADR-0009: Phase 12 RLS testing with pgTAP

## Status

Accepted

## Context

`docs/roadmap.md`'s Phase 12 calls for "RLS testing", "Authorization testing", and "Database and Security Tests" (`docs/testing.md`) covering organization isolation, role-based access, and permission boundaries. Before this phase, every test in the repo exercised the Supabase client through mocks (see `*.service.test.ts` across `src/features/*`) — none of them ran against a real Postgres instance with RLS actually turned on. A mocked test can assert "the service calls `.eq('organization_id', ...)`" but cannot prove the database would actually reject a cross-tenant read if the service layer forgot that filter, which is the exact failure mode RLS exists to catch.

Standing up `supabase test db` also surfaced a real bug: a fresh `supabase db reset` failed outright, because `20260910090000_phase8_approval_fixes.sql` re-created a `time_entries` SELECT policy that `20260909090000_phase8_approvals.sql` already created, without a `drop policy if exists` guard first (unlike the two `audit_logs` policies in the same file, which do have the guard). This had gone unnoticed because the developer's working database had already drifted past that point; it would have broken CI or any new environment's first migration run.

## Decision

**Use pgTAP** (`supabase test db`), not a hand-rolled test harness against `@supabase/supabase-js`. It runs as native SQL inside Postgres, authenticating as the real `authenticated` role via the same `request.jwt.claim.sub` GUC that PostgREST sets in production, so it exercises the actual RLS policies rather than a re-implementation of them.

**Test files live under `supabase/tests/database/`**, one file per concern:
- `rls_organization_isolation.test.sql` — a member of one organization gets zero rows querying another organization's `organizations`, `memberships`, `roles`, `clients`, `projects`, `time_entries`, `timesheets`, `invitations`, `audit_logs`, and `notifications`.
- `rls_role_permissions.test.sql` — within one organization, `has_permission()`-gated actions (`clients.manage`, `organization.manage_settings`, `audit_logs.view`, `timesheets.approve`, `members.invite`) actually differ by role, not just by what the frontend nav hides.

**Each file is a single transaction that rolls back at the end** (`begin; ... rollback;`), so fixtures (test users, orgs, memberships) never persist and the suite needs no separate cleanup step. Fixture setup runs as the `postgres` role (which bypasses RLS, same as any `SECURITY DEFINER` function), and only the assertions themselves switch to `set local role authenticated` with a `request.jwt.claim.sub` GUC — mirroring exactly how PostgREST authenticates a real request.

**Fixed the `time_entries` policy migration** to `drop policy if exists` before recreating, matching the pattern already used for the `audit_logs` policies in the same file, so `supabase db reset` succeeds from a clean database. This is a correction to existing migration 20260910090000, not a new migration — the statement is idempotent either way.

**Enabled pgTAP via its own migration** (`20260913090000_phase12_enable_pgtap.sql`), since the extension needs to exist for `supabase test db` to run at all, including in CI. It's inert in production beyond adding functions to the `extensions` schema.

## Consequences

- `npm run test:rls` (wraps `supabase test db`) requires Docker and the local Supabase stack (`supabase start`); it is not part of the plain `npm test` Vitest run, and should be added to CI as its own step once Phase 13 sets up CI.
- New RLS policies or `has_permission()` checks added in future phases should get a corresponding pgTAP assertion in one of these two files (or a new one, for a genuinely different concern) rather than only a mocked service test.
- A `supabase db reset` now succeeds from scratch, which the pgTAP suite (and any future CI pipeline) depends on.
