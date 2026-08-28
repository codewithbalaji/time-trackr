# Supabase CLI Workflow

How schema changes move from your machine to the shared/remote database. Applies to
every phase, not just Phase 2.

Project is already linked to the remote project (`supabase/.temp/project-ref`), and
the CLI is installed (`supabase --version` → confirm before starting).

## 0. One-time setup per machine

- Install Docker Desktop and make sure it's running (`supabase start`/`db reset` need
  it — they run Postgres, GoTrue, PostgREST, Storage, etc. as containers).
- `supabase login` once, if this machine hasn't authenticated before.
- The project is already linked, so you don't need `supabase link` again unless
  `supabase/.temp/project-ref` gets deleted or you're on a fresh clone.

## 1. Write a migration

Never edit the database by hand (in Studio or via `psql`) and never hand-edit an
already-applied migration file — always add a new one:

```
supabase migration new <short_description>
```

This creates `supabase/migrations/<timestamp>_<short_description>.sql`. Write plain
SQL: `create table`, `alter table`, RLS policies, functions, etc. Follow the
conventions in `docs/database.md` (UUID PKs, explicit FKs, RLS on every table that
holds org-owned or user-owned data, indexes on FKs and filtered columns).

## 2. Apply it locally and verify

```
supabase start        # first time / after a while — boots the local stack
supabase db reset      # drops the local DB and replays every migration + seed.sql from scratch
```

`db reset` is the important one: it's how you catch a migration that only works
because of leftover local state. Run it every time before you consider a migration
"done," not just the first time you write it.

Then actually look at what you built:
- **Studio** at `http://127.0.0.1:54323` — browse tables, run ad-hoc SQL, inspect RLS
  policies.
- **Inbucket/Mailpit** (email testing) at `http://127.0.0.1:54324` — every
  signup-confirmation/invite/recovery email sent locally lands here instead of a
  real inbox.
- Walk the actual user flow in the running app (`npm run dev`) against the local
  Supabase instance — a migration that "looks right" in Studio can still fail at the
  RLS layer when the frontend calls it as a real user.

If something's wrong, edit the same migration file and `supabase db reset` again —
only start a second migration file once the first one is applied to the remote
project (next step) and other people might already have it.

## 3. Regenerate types

Whenever a migration changes a table, function, or enum shape:

```
supabase gen types typescript --local > src/lib/database.types.ts
```

(`--local` reads from your locally running instance; use `--linked` instead if you
want to generate from the remote project's current schema — e.g. to confirm what's
actually live.) Commit the regenerated file alongside the migration.

## 4. Push to the remote project

Once it's verified locally:

```
supabase db push
```

This applies any migration files that haven't been applied to the linked remote
project yet, in order. It will refuse to push if the remote's migration history has
diverged from local (e.g. someone else pushed a migration you don't have) — pull /
resolve that first rather than forcing.

To check what's already applied remotely vs. what's only local:

```
supabase migration list
```

## 5. Confirm the push worked

- `supabase migration list` again — the new migration should now show as applied on
  both `Local` and `Remote`.
- Open the remote project in the Supabase dashboard (Table Editor / SQL Editor) and
  spot-check the new table/policy.
- If the change affects RLS or a security-sensitive path, re-run the manual
  verification checklist for that change (see e.g.
  `docs/decisions/0002-organization-rls-and-invites.md`'s RLS checklist) against the
  **remote** project, not just local — local and remote can drift if a migration was
  ever applied out of band.

## Auth email config (SMTP)

`[auth.email.smtp]` in `supabase/config.toml` is checked in and points at Resend
(`smtp.resend.com`, sending domain `mail.timetrackr.bkads.in`) — see
`docs/decisions/0002-organization-rls-and-invites.md`. The file only references
`env(RESEND_SMTP_PASSWORD)`; the real API key is never committed.

This section of `config.toml` isn't part of a migration — it's Auth service
config, applied with:

```
supabase config push
```

Set `RESEND_SMTP_PASSWORD` in your own shell (or a non-`VITE_`-prefixed entry in
`.env`) before running this — **never** as a `VITE_*` variable, which Vite would
expose to the browser bundle. This step touches the live remote project's Auth
settings directly, so run it yourself rather than having an agent run it with your
key.

## Edge Functions (if a change touches `supabase/functions/`)

Test locally first:

```
supabase functions serve <function-name> --env-file supabase/.env.local
```

Deploy explicitly — `db push` does **not** deploy functions:

```
supabase functions deploy <function-name>
```

Secrets (e.g. `SUPABASE_SERVICE_ROLE_KEY`) are set once per project, not per deploy:

```
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<value>
supabase secrets list   # confirm, without printing values
```

## Rollback

There is no `supabase migration down`. To undo a bad migration:
- If it hasn't been pushed yet: edit or delete the local migration file, `supabase
  db reset`.
- If it has been pushed: write a **new** migration that reverses the change (e.g.
  `drop table`, `alter table ... drop column`) and push that. Never delete or
  rewrite a migration file that's already been applied to the remote project — other
  clones' migration history has to match yours exactly.

## Quick reference

| Task | Command |
|---|---|
| New migration file | `supabase migration new <name>` |
| Apply migrations locally from scratch | `supabase db reset` |
| Start local stack (if not running) | `supabase start` |
| Stop local stack | `supabase stop` |
| Regenerate TS types from local DB | `supabase gen types typescript --local > src/lib/database.types.ts` |
| See local vs. remote migration status | `supabase migration list` |
| Push local migrations to remote | `supabase db push` |
| Serve an Edge Function locally | `supabase functions serve <name>` |
| Deploy an Edge Function | `supabase functions deploy <name>` |
| Set an Edge Function secret | `supabase secrets set KEY=value` |
