# ADR-0008: Phase 11 audit coverage for organizations, memberships, and invitations

## Status

Accepted

## Context

Phase 11 (`docs/roadmap.md`) closes out the Phase 4 audit foundation: "Audit coverage for any mutation not already writing into the Phase 4 foundation (organizations, users, projects, time entries, timesheets, approvals)." `clients`, `projects`, `project_members`, `time_entries`, and `timesheets` (which also covers approvals — approve/reject are status updates on `timesheets`) already write into `audit_logs` via the generic `log_audit_event()` trigger introduced in ADR-0005. Three gaps remained: `organizations` (settings updates), `memberships` (creation, removal, status changes), and `invitations` (creation, revoke, resend).

Two problems specific to these tables meant the trigger couldn't be attached unmodified:

1. `organizations` has no `organization_id` column — it *is* the organization. `log_audit_event()`'s existing fallback chain (direct column, then a `project_id` lookup) would resolve to `null` and violate `audit_logs.organization_id`'s `NOT NULL` constraint.
2. `memberships` already gets a manual audit write for role changes: `assign_membership_role()` inserts a `role_assigned` row itself, in the same transaction as its `UPDATE`. Attaching the generic trigger unfiltered to `memberships` would fire a second, redundant `memberships_updated` row for that same statement.

## Decision

**Extend `log_audit_event()` with a table-specific fallback**, not a second trigger function: when the two existing lookups both resolve to `null` and `tg_table_name = 'organizations'`, use the row's own `id`. This keeps a single audit-writing function for every table, consistent with ADR-0005's intent, rather than forking a near-duplicate for one table.

**Attach `organizations`'s trigger to `UPDATE` only.** Creation runs through `create_organization_with_owner()` (no "before" row exists to diff), and the application never deletes an organization.

**Attach `invitations`'s trigger unfiltered** (`insert or update or delete`), the same as `clients`/`projects` — nothing about invitation writes needs filtering.

**Split `memberships` into two triggers** to avoid the role-change double-write: `memberships_audit_log_write` fires on `insert or delete` (unfiltered — membership creation and removal are always worth logging), and `memberships_audit_log_status` fires on `update` gated by `when (old.status is distinct from new.status)`, so it only catches suspend/reactivate transitions. Role reassignment continues to be logged solely by `assign_membership_role()`'s own explicit insert.

**No RLS changes.** `audit_logs`'s existing `select` policy (`has_permission(organization_id, 'audit_logs.view')`) isn't scoped by `target_type`, so it already covers these three new target types without modification.

## Consequences

- A membership role change and a membership status change now produce clearly distinct audit actions (`role_assigned` vs. `memberships_updated`) instead of risking a duplicate row if the trigger had been attached unfiltered.
- Like the tables ADR-0005 covers, `organizations`/`memberships`/`invitations` audit rows store the full row via `to_jsonb` in `metadata`, not a curated diff — same accepted tradeoff, revisit only if a future column on these tables is sensitive or large.
- The Phase 11 audit log viewer (`src/features/audit/`) can read all eight audited target types through one query shape, since none of them needed a bespoke RLS policy.
