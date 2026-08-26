# Development Roadmap

The application will be developed incrementally.

Each phase should be completed and understood before moving to the next phase.

Do not implement the entire application in a single pass.

---

# Cross-Cutting Concerns

Some product areas are not their own phase because they are addressed incrementally, inside other phases, rather than all at once. Treat these as standing obligations, not a gap:

- **Settings** — organization settings land in Phase 2, project settings in Phase 5, notification preferences in Phase 10. There is no single "Settings phase"; each phase that introduces a settings surface is responsible for it.
- **Audit logging** — a minimal audit foundation (generic log table + a trigger/service pattern) is introduced in Phase 4, immediately after RBAC exists, rather than bolted on at the end. Each later phase that adds meaningful mutations (projects, time entries, timesheets, approvals) should write into that foundation as it goes. Phase 11 is where audit coverage and the audit log UI are finished and verified, not where logging starts.

---

# Phase 0 — Engineering Foundation

## Goal

Establish the project architecture, documentation, conventions, tooling, and development workflow.

## Includes

- Project setup
- Dependencies
- Environment configuration
- Folder architecture
- AI instructions
- Product documentation
- Architecture documentation
- Database conventions
- Security conventions
- Design system
- Testing strategy
- Git workflow

## Definition of Done

The project foundation is documented and the application is ready for feature development.

---

# Phase 1 — Authentication

## Goal

Establish user identity and authentication.

## Includes

- Sign up
- Login
- Logout
- Session management
- Protected routes
- Email verification
- Password reset
- Authentication state
- Authentication error handling

---

# Phase 2 — Organizations / Multi-Tenancy

## Goal

Establish organization-level ownership of application data.

## Includes

- Organizations
- Organization membership
- Organization context
- Organization switching if required
- Organization-level data isolation
- Basic invite mechanism (an org owner can invite a member) so Phase 3 has real members to manage
- Initial RLS design

---

# Phase 3 — Users / Employees

## Goal

Manage users within an organization.

## Includes

- Employee directory
- User profiles
- Membership management
- Inviting users
- User status
- User administration

---

# Phase 4 — Authorization / RBAC

## Goal

Control what users are allowed to do.

Builds on the real organization members introduced in Phases 2–3 — role assignment needs actual members to assign roles to.

## Includes

- Roles
- Permissions
- Role assignment
- Permission checks
- Frontend authorization
- Database authorization
- RLS policies
- Minimal audit log foundation (generic audit table + trigger/service pattern) for later phases to write into (see Cross-Cutting Concerns above)

---

# Phase 5 — Clients and Projects

## Goal

Allow organizations to manage work structures.

## Includes

- Clients
- Projects
- Project members
- Project status
- Project settings
- Project assignment

---

# Phase 6 — Time Tracking

## Goal

Provide the core time tracking experience.

## Includes

- Start timer
- Stop timer
- Pause/resume if required
- Manual time entry
- Time entry editing
- Time entry deletion
- Duration calculations
- Project/task selection

---

# Phase 7 — Timesheets

## Goal

Provide structured employee timesheets.

## Includes

- Daily view
- Weekly view
- Time summaries
- Submission
- Status management
- Editing rules

---

# Phase 8 — Approval Workflow

## Goal

Allow authorized users to review and approve submitted timesheets.

Note: approvals/rejections are silent (no notification) until Phase 10 wires up notifications. This is intentional sequencing, not a gap — confirm status changes by checking the review queue/history until then.

## Includes

- Review queue
- Approve
- Reject
- Re-submit
- Approval status
- Approval history

---

# Phase 9 — Dashboard and Reports

## Goal

Provide useful visibility into time data.

## Includes

- Dashboard
- Time summaries
- Team summaries
- Project summaries
- Productivity-related reporting where appropriate
- Filters
- Export functionality where required

---

# Phase 10 — Notifications

## Goal

Provide useful system notifications.

## Includes

- In-app notifications
- Approval notifications
- Reminder notifications
- Important status changes

---

# Phase 11 — Audit Logs

## Goal

Complete traceability for important actions, building on the audit foundation introduced in Phase 4. This phase finishes coverage and adds a way to view it — it does not introduce audit logging for the first time.

## Includes

- Audit coverage for any mutation not already writing into the Phase 4 foundation (organizations, users, projects, time entries, timesheets, approvals)
- Actor
- Action
- Timestamp
- Resource
- Relevant metadata
- Audit log viewer/UI

---

# Phase 12 — Testing and Security Hardening

## Goal

Strengthen reliability and security.

## Includes

- Expanded test coverage
- RLS testing
- Authorization testing
- Edge cases
- Error handling review
- Performance review
- Security review

---

# Phase 13 — Production Readiness

## Goal

Prepare the application for real production use.

## Includes

- Production environment
- Deployment
- Monitoring
- Logging
- Database backup strategy
- Performance checks
- Error tracking
- CI/CD
- Documentation
- Operational procedures

---

# Development Rule

Only move to the next phase when the current phase has:

- Working implementation
- Tests where appropriate
- Documentation
- Security considerations
- Understanding of the architecture

The goal is not merely to finish quickly.

The goal is to build a maintainable application while understanding why each architectural decision exists.