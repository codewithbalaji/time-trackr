# ADR-0010: Phase 13 production readiness decisions

## Status

Accepted

## Context

Phase 13 (`docs/roadmap.md`) covers production environment, deployment, monitoring,
logging, backups, CI/CD, and operational procedures. Three decisions had to be made
before any of that could be built, since they determine what the rest of the phase
even means:

1. Which Supabase project is production — the repo already had one real project
   wired up in `.env` (not a placeholder), but nothing had formally designated it
   as production versus a shared dev project.
2. Where the frontend deploys.
3. Which error tracker to use.

## Decision

**The existing Supabase project (`.env`'s `VITE_SUPABASE_URL`) is production.** No
second project is being provisioned. This means local development must stop
pointing at it — `docs/supabase-cli-workflow.md`'s local stack
(`supabase start`) is now the only sanctioned place to develop against, and
`docs/deployment.md` records this explicitly.

**Frontend hosting is deferred to Cloudflare, set up separately, later.** This phase
does not add a `wrangler.toml` or a deploy workflow step for it — `docs/deployment.md`
has a placeholder section to fill in once that happens, but CI (lint/typecheck/tests/
build/pgTAP) doesn't depend on a hosting target existing yet.

**Sentry (`@sentry/react`) for frontend error tracking**, wired up opt-in via
`VITE_SENTRY_DSN` (`src/lib/sentry.ts`, initialized in `src/main.tsx`) so the app is
byte-for-byte identical to before when the variable is unset — no Sentry project has
been created yet, so this ships inert until someone sets the DSN. A `Sentry.ErrorBoundary`
around `<App />` (`src/app/ErrorFallback.tsx`) was added alongside it since an
uncaught render error previously produced a blank white screen with no recovery
path and no report.

**CI added** (`.github/workflows/ci.yml`): one job for lint/typecheck/build/Vitest,
one job that boots a disposable local Supabase stack and runs the pgTAP suite from
ADR-0009. Deliberately does **not** run `supabase db push` against production —
with only one Supabase project and no staging environment to catch a bad migration
first, an automated production push has a meaningfully larger blast radius than an
automated test run. That stays a manual step per `docs/supabase-cli-workflow.md`.

**Fixed `.env.example`**, which had committed the real production project URL and
publishable key instead of placeholders — found while confirming which project was
production. The publishable key isn't a secret (RLS-protected, same as any
Supabase anon key), but a template file encoding which project is live is bad
practice regardless, and matters more now that project is formally production.

## Consequences

- Anyone developing locally needs to switch their `.env` to point at their own
  `supabase start` instance instead of the shared project, if they weren't already.
- Database backup strategy (`docs/deployment.md`) is documented as guidance to
  verify against the actual Supabase plan/dashboard, not a confirmed configuration
  — this session had no access to that project's billing settings to check directly.
- Frontend hosting, its rollback procedure, and uptime monitoring remain open until
  Cloudflare is set up — `docs/deployment.md` names exactly what's left.
