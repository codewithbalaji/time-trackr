# ADR-0002: Organization RLS design and invite delivery mechanism

## Status

Accepted

## Context

Phase 2 introduces `organizations`, `memberships`, and `invitations`, and needs to establish org-level data isolation via RLS from the start (`docs/database.md`, `docs/security.md`). Two problems needed a deliberate design:

1. A Postgres RLS policy on `memberships` that subqueries `memberships` to check "is this user a member of this org?" recurses into its own policy.
2. Sending an invite email requires `auth.admin.inviteUserByEmail`, which needs the service-role key — and per `docs/security.md`, that key must never run in frontend code.

## Decision

**RLS-recursion-safe helper functions.** `is_org_member(org_id)` and `is_org_owner(org_id)` are `security definer` SQL functions with a fixed `search_path` (the same pattern already used by `handle_new_user` in ADR-0001). Being `security definer`, their internal read of `memberships` bypasses RLS, so a policy on `memberships` (or `organizations`, or `invitations`) can call these functions without re-triggering `memberships`' own policy and recursing.

**RPCs for multi-table writes, plain RLS for single-table writes.** Creating an organization requires two inserts (`organizations` + an owner `memberships` row) that must succeed together, so it's a `security definer` RPC (`create_organization_with_owner`). Accepting an invitation similarly touches two tables (`memberships` insert + `invitations` update) atomically, so it's also an RPC (`accept_invitation`). Creating an invitation is a single-table insert, so it uses a plain RLS `insert` policy (`is_org_owner(organization_id) and invited_by = auth.uid()`) instead of a function — no atomicity concern, so no need for the extra indirection.

`get_invitation_by_token` is a third RPC: an invited user has a session but isn't a member of the org yet, so plain RLS on `organizations`/`invitations` wouldn't let them read the org name to display before they join. It's `security definer` and returns only the specific preview columns needed, not full rows.

**Invite delivery via Supabase's built-in invite email, sent from an Edge Function.** `supabase/config.toml` already wires `auth.email.template.invite` to `supabase/templates/invite.html`, built for exactly this flow. `auth.admin.inviteUserByEmail` both sends that email and auto-authenticates the invitee's session when they click it (the same way `type=recovery` links already work in this codebase) — no separate email-verification step is needed for invited users. Since that call requires the service-role key, it runs in a new Edge Function (`supabase/functions/send-invite-email`), which re-verifies (via the caller's forwarded JWT) that the invitation belongs to an org the caller owns before sending, rather than trusting the client-supplied `invitationId` blindly.

**`profiles` RLS is left unchanged.** ADR-0001 flagged that its self-scoped policies ("should be revisited once organization membership exists") — but Phase 2's flows (onboarding, invite-accept) never need to read another member's profile. That need arrives with Phase 3's member list, which is the right point to add a membership-scoped `select` policy on `profiles`.

**Role as `check`-constrained text, not a Postgres enum.** `memberships.role` and `invitations.role` are `text check (... in ('owner', 'member'))`. Phase 4 (RBAC) will need to add more roles; `ALTER TYPE ... ADD VALUE` has transactional restrictions a `check` constraint doesn't, so a constraint is the simpler thing to extend later.

## Consequences

- No pgTAP or SQL test harness exists yet, and adding one is more tooling than Phase 2's scope warrants. RLS correctness for this migration should instead be verified manually before considering Phase 2 done:
  1. Create two organizations (as two different owners). Confirm owner A cannot `select` org B's `organizations`, `memberships`, or `invitations` rows.
  2. Confirm a user with no membership at all sees zero rows from all three tables.
  3. Confirm `accept_invitation` rejects: an unknown token, an expired invitation, and a token whose invitation email doesn't match the caller's authenticated email.
  - Revisit with a real pgTAP suite in Phase 4, once RBAC significantly grows the policy surface.
- Production deployments must configure a real SMTP provider and set `SUPABASE_SERVICE_ROLE_KEY` as an Edge Function secret (`supabase secrets set`) — invites will not send without both. `[auth.email.smtp]` in `supabase/config.toml` is configured for Resend's SMTP relay (`smtp.resend.com`, sending domain `mail.timetrackr.bkads.in`); the actual API key is resolved from the `RESEND_SMTP_PASSWORD` env var at `supabase config push` time and is never committed — see `docs/supabase-cli-workflow.md`. This also lifted Supabase's default shared-mailer rate limit (2 emails/hour), which is what originally blocked repeated invite/signup testing; `auth.rate_limit.email_sent` is raised to 30 accordingly.
- Phase 3 (member list, revoke/resend invites) will add `update`/`delete` policies to `invitations` and a membership-scoped `select` policy to `profiles`; this migration deliberately leaves those out since nothing in Phase 2 needs them yet.
