# ADR-0005: Phase 5 write path, audit trigger, and access model for clients/projects

## Status

Accepted

## Context

Phase 5 (`docs/roadmap.md`) adds `clients`, `projects`, and project membership/assignment on top of Phase 2–4's organizations, RLS helpers, and RBAC. Several decisions needed to be made deliberately rather than by copying Phase 4's shape verbatim, since every write in this phase turned out to be single-table (unlike Phase 2's `create_organization_with_owner`/`accept_invitation`, which touch two tables atomically).

## Decision

**Plain RLS for every write, no new RPCs.** Per ADR-0002's rule ("multi-table atomic writes → security-definer RPC, single-table writes → plain RLS policy"), creating/updating/archiving a client or project, and adding/removing a `project_members` row, are each a single `insert`/`update`/`delete` on one table. None of them need the atomicity an RPC exists to provide, so this phase introduces zero new RPCs — a real simplification versus Phase 2–4.

**A generic `security definer` audit trigger, not per-RPC manual inserts.** Phase 4's `audit_logs` foundation was written into by `assign_membership_role()` explicitly calling `insert into audit_logs (...)` inside its own function body. With no RPC in this phase, there's no function body to put that insert in — and `audit_logs` deliberately has no `insert` policy for ordinary authenticated writes (writes must come from a trusted, privilege-escalated context). The alternative to reintroducing an RPC just to get an audit line is a small generic `security definer` trigger function (`log_audit_event()`) fired `after insert or update or delete` on `clients`, `projects`, and `project_members`. It derives `action`/`target_type` from `tg_table_name`/`tg_op`, resolves `organization_id` directly from the row (or, for `project_members`, via its parent `projects` row), and writes the affected row's data into `metadata`. This keeps the roadmap's cross-cutting audit obligation satisfied without walking back the plain-RLS simplification above. Future phases with single-table writes can reuse this same trigger rather than defaulting back to RPCs purely for audit purposes.

**Archive over delete.** Neither `clients` nor `projects` has a delete RLS policy or a `deleted_at` column — the only lifecycle-removal action is `status = 'archived'`. This is deliberate: Phase 6 will add `time_entries.project_id`, and leaving hard delete out now avoids having silently decided (by omission) what happens to historical time entries when their project disappears. If hard delete is ever wanted, that decision should be made explicitly once Phase 6 exists to reason about.

**Open view, permission-gated write.** Any active org member can `select` `clients`/`projects`/`project_members` (via `is_org_member`), matching the existing `roles` table's own select policy — "any member can see it, only privileged roles can change it." Only `clients.manage`/`projects.manage` (new permission-catalog entries, granted to Owner/Admin by the same seeding mechanism Phase 4 established) gate writes. This is narrower than Clockify's public/private per-project access model (see the Phase 5 planning screenshot) — that's a deliberate scope cut, not an oversight: nothing in the roadmap requires per-project visibility restriction yet, and `project_members` already exists to support a future "my projects" filter (Phase 6) without needing to become an access-control mechanism today.

**`project_members` insert cross-checks organization membership.** The insert policy joins through `projects` to `memberships` and requires the assignee to be an *active* member of the project's own organization. Without this, a caller with `projects.manage` in org A could otherwise assign a `project_members` row for a user belonging to org B, since nothing else ties `project_members.user_id` to an organization.

## Consequences

- No pgTAP suite exists yet (same situation ADR-0002 left for Phase 2); Phase 5's RLS correctness is verified manually per the checklist in the implementation plan, and should get real automated coverage whenever Phase 12 (Testing and Security Hardening) builds out a pgTAP harness.
- The generic audit trigger's `metadata` currently stores the entire row (via `to_jsonb`) rather than a curated diff. That's acceptable for these three small tables today; a table with sensitive or very large columns would need a narrower version of this trigger rather than reusing `log_audit_event()` as-is.
- Introducing `clients.manage`/`projects.manage` as single bundled permissions (rather than splitting create/edit/archive/assign-members into separate keys, the way Phase 4 split `members.manage_status` from `members.remove`) is a deliberate granularity choice: those actions are comparable in risk and always exercised by the same Admin/Owner audience, so a finer split would only add permission-catalog rows nothing in the roadmap asks for.
