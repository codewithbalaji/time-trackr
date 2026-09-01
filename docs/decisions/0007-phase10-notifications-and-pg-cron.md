# ADR-0007: Phase 10 notifications — cross-user writes and pg_cron

## Status

Accepted

## Context

Phase 10 adds in-app notifications: approvers need to hear about a newly
submitted timesheet, and an employee needs to hear their timesheet was
approved or rejected. Both cases require writing a row for a user who is
**not** the one making the request — the submitting employee has no
row-level right to write a notification for an approver, and vice versa.
Existing RLS on `timesheets`/`audit_logs` only ever lets a caller act on
their own row or a row they've been granted permission over via
`has_permission()`; there is no precedent for one member writing data owned
by another member.

Separately, "reminder notifications" (nudge an employee about a still-draft
timesheet, nudge an approver about a stale submission) need to run on a
schedule, independent of any user action. This codebase has no scheduled-job
infrastructure at all — every existing side effect is triggered either by a
direct user action (an RPC call) or a database trigger on a row change.

## Decision

1. **A single non-client-callable insert helper.** `public.create_notification(...)`
   is `SECURITY DEFINER` and has `EXECUTE` revoked from `authenticated`/`anon`
   (this project's `alter default privileges ... grant execute on functions
   to authenticated` — see `20260826093405_remote_schema.sql` — grants
   `EXECUTE` to `authenticated` automatically on every new function, so this
   revoke had to target those roles directly; revoking from `PUBLIC` alone is
   a no-op against a grant made straight to a named role, which is what
   `20260911091500_phase10_notification_grants_fix.sql` corrects). It is only
   reachable from other trusted `plpgsql` functions, keeping the trust
   boundary at the existing guarded RPCs instead of opening a general
   "insert any notification for any user" endpoint.

2. **`submit_timesheet`/`resubmit_timesheet` become `SECURITY DEFINER`.**
   `approve_timesheet`/`reject_timesheet` already ran this way (Phase 8).
   To notify approvers on submission, `submit_timesheet`/`resubmit_timesheet`
   now need the same elevation — their existing `is_org_member`/status guards
   remain the sole authorization boundary, unchanged in behavior, just now
   running with the privilege needed to call `create_notification` for a
   different recipient.

3. **`pg_cron` for reminders**, scheduled once daily in UTC
   (`0 7 * * *`), calling a single `SECURITY DEFINER` function
   (`run_timesheet_reminders()`, also not callable by `authenticated`/`anon`)
   that loops all organizations. Idempotency is a per-`(recipient, type,
   target)` "does an unread reminder already exist" check rather than a
   uniqueness constraint — simpler, and self-heals once a reminder is read or
   its underlying condition resolves.

## Consequences

- `submit_timesheet`/`resubmit_timesheet` now carry the same elevated-privilege
  review burden as `approve_timesheet`/`reject_timesheet` — any future change
  to their guard clauses needs the same scrutiny, since a bug now has a
  larger blast radius (writing rows for other users, not just the caller).
- Reminder delivery time is fixed in UTC, not a true per-org local "morning."
  Multi-timezone scheduling was judged not worth the added complexity for a
  reminder nicety in this phase.
- This is the first scheduled job in the project. Any future job should
  reuse the same pattern: a single `SECURITY DEFINER` function with no
  client `EXECUTE` grant, scheduled via `cron.schedule`.
- Revoking `EXECUTE` from a named role (not just `PUBLIC`) is now the
  established pattern for any future "internal only" function in this
  project's schema, given the default-privilege grant to `authenticated`.
