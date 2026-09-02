# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Employee** — tracks working time, adds time entries, views personal timesheets, submits timesheets, views relevant projects.
- **Team Lead** — views team activity; may review and approve/reject team timesheets depending on organization rules.
- **Manager** — manages projects, reviews team activity, approves timesheets, views reports.
- **Administrator** — manages organization settings, users, roles, permissions, projects, and administrative information.

## Product Purpose

Time Trackr replaces the company's spreadsheet-based time tracking with a centralized web application. Spreadsheets create manual data entry, inconsistent formats, difficult approvals, limited visibility, difficult reporting, duplicate/incorrect data, no centralized history, and poor scalability. Success means a centralized, reliable system where employees record work time and managers review, approve, and report on it — one that is easier to use than the spreadsheet workflow it replaces.

## Positioning

No differentiated market positioning yet — this starts as an internal tool for one company, not a competitive play against products like Toggl or Harvest. Undecided/not a current concern.

## Operating Context

- First deployment serves a single company but the architecture must support multiple organizations, each with isolated data (org memberships, org-specific roles, projects, time entries, and settings).
- Built incrementally by phase; do not implement future-phase functionality ahead of schedule.
- Currently in progress: Phase 1 (Authentication) is implemented — signup, login, logout, password reset, protected routes, `profiles` table synced via DB trigger (see `docs/decisions/0001-profiles-trigger-sync.md`). Phases 2+ (organizations, users/RBAC, clients/projects, time tracking, timesheets, approvals, dashboard/reports, notifications, audit logs) are not yet built.

## Capabilities and Constraints

Core product areas (per `docs/product.md`): authentication, organizations, users and memberships, roles and permissions, clients, projects, time tracking, timesheets, approval workflows, dashboard, reports, notifications, audit logs, settings.

Non-goals for the initial product: payroll processing, recruitment, performance management, full HR management, accounting, and invoicing (unless introduced later as an explicit requirement).

## Brand Commitments

- Product/company name: **Time Trackr**.
- `src/assets/logo.png` is the real product logo — treat it as a binding brand asset, not a placeholder.

## Evidence on Hand

- `docs/product.md` — full product context, target users, core product areas, SaaS direction, non-goals, and product principles (source document for this file).
- `src/assets/logo.png` — real product logo asset.
- No testimonials, case studies, press, pricing, or usage data exist yet — do not fabricate any.

## Product Principles

- **Simplicity** — easier to use than the spreadsheet workflow it replaces.
- **Accuracy** — time data must be consistent, validated, and auditable.
- **Security** — users only access information they're authorized to access.
- **Scalability** — architecture supports growth without a full rewrite.
- **Maintainability** — codebase stays understandable as features increase.
