# Deployment & Production Readiness (Phase 13)

This is the operational counterpart to `docs/supabase-cli-workflow.md`, which already
covers the database side (migrations, rollback, Edge Functions) in detail — this file
doesn't repeat that. It covers everything else Phase 13 adds: environments, CI, the
frontend deploy (once a host is chosen), error tracking, and backups.

## Environments

There is currently **one** Supabase project, referenced by `.env`
(`VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`), and it is **production** —
real user data lives there. This was a deliberate Phase 13 decision (not a temporary
state): no separate staging/dev Supabase project exists.

Practical consequences:

- **Local development does not point at the shared project.** Use the local stack
  (`supabase start`, per `docs/supabase-cli-workflow.md`) for day-to-day work, and
  point your local `.env` at it (`http://127.0.0.1:54321` and the local anon key
  printed by `supabase start`) rather than the real URL, so schema experiments and
  test data never touch production.
- **`.env.example` must only ever contain placeholder values.** It previously
  committed the real production project URL and publishable key — fixed as part of
  this phase. The publishable key itself isn't a secret (it's protected by RLS,
  same as any Supabase anon key), but a template file should never encode which
  project is production.
- Migrations reach production via `supabase db push`, exactly as documented in
  `docs/supabase-cli-workflow.md` — CI does **not** push migrations automatically
  (see below).

## CI (`.github/workflows/ci.yml`)

Two jobs run on every push to `main` and every pull request:

- **`app`** — `npm ci`, lint, `tsc -b`, the Vitest suite, and a production build.
  Node 22 (current LTS), pinned in the workflow rather than following whatever
  version a contributor's machine happens to run.
- **`database`** — boots a disposable local Supabase stack via
  `supabase/setup-cli` and runs `supabase test db` (the pgTAP suite from
  ADR-0009). This is what would have caught the Phase 8 migration bug on the very
  next PR, instead of silently drifting until someone ran a clean `db reset`.

**CI never touches the production Supabase project** — the `database` job only ever
runs against its own ephemeral local stack. Pushing migrations to production
(`supabase db push`) stays a deliberate, manual step per
`docs/supabase-cli-workflow.md` — automating that into CI is a reasonable future
step once there's more confidence in the pipeline, but isn't done yet, since an
unattended `db push` against the only Supabase project (there's no staging to catch
a bad migration first) is a meaningfully bigger blast radius than an unattended test
run.

## Frontend hosting

Deployed to **Cloudflare Pages** (project `timetrackr`, account "Calispec"), via
the CLI rather than Cloudflare's git integration — there is no automatic deploy
on push yet, only manual deploys:

```
npm run build
npx wrangler pages deploy dist --project-name=timetrackr
```

- **Build command / output**: `npm run build` / `dist`. `public/_redirects`
  (`/* /index.html 200`) is copied into `dist` by Vite and gives Cloudflare Pages
  the SPA fallback rule — without it, refreshing on any route other than `/`
  404s, since there's no server-side route matching e.g. `/time-tracking`.
- **Environment variables**: baked in at build time from the local `.env`
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SENTRY_DSN`) since
  this is a CLI deploy, not a Cloudflare-triggered build — there's nothing to set
  in the Pages dashboard as long as deploys keep happening this way. If this
  moves to Cloudflare's git integration later, those same variables need to be
  set as Pages project environment variables instead.
- **URL**: `https://timetrackr-a82.pages.dev` (Cloudflare appended a suffix; no
  custom domain attached yet).
- **Rollback**: Cloudflare Pages keeps every previous deployment — promote an
  older one from the dashboard (Pages → timetrackr → Deployments → "Rollback to
  this deployment"), or redeploy an old commit's `dist` via the CLI.

### ⚠ Follow-up required: Supabase Auth redirect allow-list

The production Supabase project's Auth settings (dashboard → Authentication →
URL Configuration) almost certainly still only allow-list `localhost` (that's
all `supabase/config.toml` has, and that file only applies to the *local* stack
unless pushed with `supabase config push` — see `docs/supabase-cli-workflow.md`).
**Signup confirmation, password reset, and invite emails will redirect
incorrectly on the live site until `https://timetrackr-a82.pages.dev` (and any
custom domain added later) is added there.** This needs to be done by hand in
the dashboard — it wasn't done as part of this deploy.

## Error tracking (Sentry)

Wired up in code (`src/lib/sentry.ts`, initialized in `src/main.tsx`, with an
`ErrorFallback` UI via `Sentry.ErrorBoundary`), but **opt-in via `VITE_SENTRY_DSN`**
— unset, the app behaves exactly as before (no Sentry code runs). To activate:

1. Create a Sentry project (React platform).
2. Set `VITE_SENTRY_DSN` in the hosting provider's environment variables once one
   is chosen (never commit a real DSN to `.env.example`, same reasoning as the
   Supabase keys above — DSNs are semi-public but a template file shouldn't imply
   which project is live).
3. Confirm errors arrive by throwing a test error in a dev build with the DSN set.

## Database backup strategy

This session doesn't have MCP access to the actual production Supabase project's
billing/plan settings, so this is guidance to verify manually rather than a
confirmed configuration:

- Supabase's free tier keeps only ~7 days of daily backups with no point-in-time
  recovery (PITR); paid tiers add configurable PITR (down to per-transaction
  restore on Pro+). Check the project's plan in the Supabase dashboard
  (Settings → Backups) and confirm the retention window matches how much data loss
  is acceptable.
- If PITR isn't available on the current plan, treat `supabase/migrations/` as the
  schema's source of truth (already true) but note that **data** has no
  finer-grained recovery than the daily backup — factor that into how much you
  trust destructive operations against production.
- Restore procedure: Supabase dashboard → Database → Backups → restore to a new
  project (Supabase does not restore in place), then re-point `.env`
  /hosting env vars at the restored project's URL/keys.

## Monitoring & logging

- **Errors**: Sentry, once `VITE_SENTRY_DSN` is set (see above).
- **Database**: Supabase's built-in Logs Explorer (dashboard → Logs) covers
  Postgres, Auth, and API logs already — no additional setup done here.
- **Uptime**: not set up. A free-tier uptime checker (e.g. UptimeRobot) against the
  deployed frontend URL, once one exists, is the cheapest next step.

## Operational procedures

- **Bad migration already pushed to production**: see
  `docs/supabase-cli-workflow.md`'s Rollback section — write a new forward-fixing
  migration, never edit or delete an applied one.
- **Bad frontend deploy**: re-promote the previous build from the host's deploy
  history (see "Frontend hosting" above — to be filled in once a host is chosen).
- **Incident escalation**: single-maintainer project at this stage — no on-call
  rotation exists. Record an actual contact/escalation path here if that changes.
