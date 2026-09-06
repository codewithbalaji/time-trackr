# ADR-0011: App-owned invitation links, sent via Resend directly

## Status

Accepted. Revises the invitation delivery mechanism described in
[ADR-0002](0002-organization-rls-and-invites.md); the RLS model in that ADR is
unchanged.

## Context

Organization invitations were delivered by calling
`auth.admin.inviteUserByEmail()` from the `send-invite-email` Edge Function.
GoTrue created the auth user, stamped the `invitations` row's token into
`user_metadata.invitation_token`, and mailed **its own** verification link.
`/auth/callback` then keyed "is this an invite?" off the presence of that
metadata field and forwarded to `/invite/accept`, which read the token back out
of the session.

Two failures came out of this, both reproduced against production data:

1. **Invitees were told a seconds-old link had already expired.** A GoTrue
   verification link is single-use. Corporate mail gateways pre-fetch links on
   delivery to scan them, which consumes the token before the recipient clicks.
   In `auth.users`, both `@calispec.ai` invitees show `email_confirmed_at`
   **7 seconds** after `invited_at`, with their `invitations` rows still
   `pending` days later. The two `@gmail.com` invitees confirmed 3–8 minutes
   later and completed the flow. The application's own `expires_at` was a clean
   7-day window throughout and was never the cause.

2. **`user_metadata.invitation_token` was never cleared.** Nothing removed it
   after acceptance, so every later email link for that user (confirmation,
   magic link) routed to `/invite/accept`, looked up a long-since-accepted
   token, and dead-ended on "This invitation is invalid".

Separately, nothing in the application could observe whether an invitation email
was actually delivered. The app never spoke to Resend; it depended entirely on
`[auth.email.smtp]` in `supabase/config.toml`, which only applies to the local
stack unless `supabase config push` is run with `RESEND_SMTP_PASSWORD` exported.
The Edge Function contained no logging at all, and `CreateInvitationForm` showed
"Invitation sent" whenever GoTrue accepted the request.

## Decision

**The invitation link is the application's own.** The email points at
`{APP_URL}/invite/accept?token=<invitations.token>` — a token that already
exists in the database, is valid for 7 days, and is not consumed by being
visited. A scanner's GET costs nothing.

Because GoTrue can only ever mail its own links, the Edge Function now calls
**Resend's API directly** with markup it renders itself
(`supabase/functions/send-invite-email/invite-email.ts`). This requires
`RESEND_API_KEY` and `APP_URL` as function secrets.

Consequences of that, in the same change:

- `inviteUserByEmail`, the `signInWithOtp` fallback for existing accounts, and
  the `invitation_token` user-metadata stamp are all gone. One code path now
  serves both new and existing invitees.
- `/invite/accept` is a **public** route. It reads the token from the URL and
  branches on signed-out (create an account), signed-in as the invited address
  (accept), signed-in as somebody else (explain and offer sign-out), expired,
  revoked, and unknown.
- A signed-out invitee signs up normally, with `emailRedirectTo` pointing back
  at the same invitation URL. That confirmation link is still single-use, but
  it is scanner-tolerant in effect: a prefetch merely confirms the address, and
  the invitee then signs in with the password they just chose and is caught by
  the pending-invitation card on `/select-organization`.
- The link host comes from the `APP_URL` secret, **not** the request's `Origin`
  header. A link built from a caller-supplied header and then emailed is a
  phishing vector; only localhost is accepted as an override, for
  `supabase functions serve`.
- A send failure no longer deletes the `invitations` row. The previous rollback
  destroyed the row and its audit trail on a transient outage; the recovery path
  is the Resend button on the Members page, which needs the row to still exist.
- `resendInvitation` rotates the token as well as extending the expiry — the
  link *is* the token, so keeping it would leave every previously mailed copy
  live.
- Every failure path in the Edge Function logs to `console.error`.

GoTrue's mailer is still used for signup confirmation, password recovery, and
email change, so the SMTP configuration in `config.toml` still matters and still
has to be pushed.

## Consequences

**Easier.** Invitation links survive mail scanners, browser prefetch, and being
clicked twice. Delivery failures surface to the person who sent the invitation
and appear in the function's logs. The invitation email's content is ours to
change without touching GoTrue templates.

**Harder.** There are now two email paths — Resend's API for invitations, GoTrue
SMTP for auth emails — and the invitation path depends on `RESEND_API_KEY` and
`APP_URL` being set as Edge Function secrets. If they are not, invitations fail
loudly rather than silently, which is the intended trade, but they do fail. See
the "Invitation email" section of `docs/deployment.md` for the deployment
checklist.

**Follow-up.** `supabase/templates/invite.html` and the
`[auth.email.template.invite]` config block were removed, since GoTrue no longer
sends invitations. A one-off migration
(`20260916090000_invite_link_flow.sql`) clears the stale
`user_metadata.invitation_token` from existing users. Any invitation email
already sitting in an inbox still points at the old GoTrue URL and will keep
failing — those need resending after deploy.
