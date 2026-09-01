# ADR-0006: Phase 9 client-side report aggregation, no new RPC or view

## Status

Accepted

## Context

Phase 9 (Dashboard and Reports) needs to show time/team/project summaries —
stat cards, a bar chart, a donut chart, a grouped summary table, a flat
detailed table, and CSV export — over a bounded date range, optionally
org-wide for approvers.

Every existing report-shaped query in the codebase (`listEntriesForPeriod` in
`timesheet.service.ts`, `listTimeEntries` in `time-entry.service.ts`) already
fetches raw rows via PostgREST and lets the frontend group/sum them — there is
no aggregation-RPC or database view precedent anywhere in the app. Report
date ranges are also bounded by the presets offered (Today / This week / Last
7 days / This month), so row counts per query stay small even at the "This
month" ceiling.

Team/org-wide visibility (Dashboard's team activity, Reports' team-member
filter) needed a way to read another org member's time entries. Phase 8
already added an RLS policy granting `SELECT` on `time_entries`/`timesheets`
to members holding `timesheets.approve`, for the approvals review queue — the
same policy covers this need without a new permission or migration.

## Decision

- No new database view, materialized view, or RPC for report aggregation.
  `src/features/reports/services/report.service.ts` adds two functions
  (`listOwnEntriesInRange`, `listOrgEntriesInRange`) that select the same
  shape of raw rows as the existing services, scoped by `[start, end)` on
  `start_time`. All grouping/summing (`groupByProject`, `groupByDescription`,
  `hoursPerDay`, `topProject`, `topClient`, `totalDuration`) happens in
  `src/features/reports/lib/aggregate.ts`, pure and unit-tested.
- Org-wide report visibility reuses the existing `timesheets.approve`
  permission and its Phase 8 RLS policy as the sole authorization boundary.
  `listOrgEntriesInRange` never re-checks the permission itself; the hook
  wrapping it (`useOrgReportEntries`) is only ever called from UI already
  gated by `useHasPermission`, purely for UX (hiding a query that would
  otherwise return an authorized-but-pointless empty/error result).
- CSV export (`src/features/reports/lib/export-csv.ts`) is generated entirely
  client-side from already-fetched, already-aggregated rows — no export
  endpoint or storage upload.

## Consequences

- Simpler: one RLS-protected `SELECT` is the entire security surface for
  reports; no new database objects to migrate, review, or keep in sync with
  schema changes.
- If report ranges grow much longer (e.g. a "This year" preset, or reporting
  across an org with thousands of entries per month), client-side aggregation
  will need revisiting — either paginating the raw query or introducing a
  real aggregation RPC. Not needed at Phase 9's bounded-preset scope.
- Because authorization for the org-wide query is entirely RLS, any future
  UI surface that calls `listOrgEntriesInRange` must remain reachable only
  from `timesheets.approve`-gated code paths, or the frontend gate becomes
  misleading rather than just redundant.
