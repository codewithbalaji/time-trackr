# ADR-0003: Multiple organizations per user, with a session-scoped picker

## Status

Accepted

## Context

Phase 2 initially shipped with a hard rule: `create_organization_with_owner` rejected a second organization for a user who already had one. That matched the original flows (sign up → onboard → one org; get invited → join → one org), but the product decision changed: a user should be able to belong to (or own) more than one organization, choose which one to work in after login, and create additional organizations from inside the app — not just once at signup.

`docs/roadmap.md`'s Phase 2 scope explicitly lists "Organization switching if required" — this is that requirement becoming required, not scope creep into Phase 3/4.

Two things needed a decision:
1. How to persist "which organization is the user currently working in," given they can now have several memberships.
2. Whether that choice should be remembered across logins, or re-asked every time.

## Decision

**No new "current organization" column or table.** The `memberships` table's unique constraint was already `(organization_id, user_id)`, not `user_id` alone — nothing in the schema assumed one org per user except `create_organization_with_owner`'s explicit guard, which is simply removed (`supabase/migrations/20260828010328_allow_multiple_organizations.sql`). RLS policies and `accept_invitation()` already scope everything by a specific `organization_id`, so they needed no changes.

**"Current organization" is a client-only, browser-tab-scoped concept, not a database concept.** The product decision is that a user re-picks their organization on every fresh login (see below) rather than having a remembered default — there's nothing to persist across devices or sessions, so a `profiles.last_active_organization_id`-style column would be unused complexity. Instead, `src/features/organizations/stores/organizationStore.ts` holds `currentOrganizationId` in a Zustand store backed by `sessionStorage` (not `localStorage`): a page reload keeps the current pick (so refreshing the dashboard doesn't bounce back to the picker), but a new tab, a new browser session, or a fresh login starts empty.

**Every login goes through `/select-organization`, unconditionally.** `LoginForm`'s success handler navigates there directly rather than to `/`, regardless of how many organizations the user has — even exactly one. This was an explicit product decision (not an inferred default): the alternative of auto-skipping straight to the dashboard when there's only one organization was considered and rejected. `useLogout` clears the store on sign-out so a subsequent login never sees a stale pick.

**`requireOrganization` (guarding the dashboard) becomes three-way**, not two-way: zero memberships → `/onboarding`; memberships exist but none is selected for this session → `/select-organization`; a valid selection exists → proceed. Creating an organization (onboarding, or the "create new" action on the picker) and accepting an invitation both call `setCurrentOrganizationId` on success, so immediately after either action a reload doesn't bounce back to the picker even though it was never explicitly "selected" through a click there.

**The picker is reachable anytime, not just right after login.** `requireMemberships` (its loader) only requires ≥1 membership, with no "already selected, skip" redirect — the sidebar's "switch organization" control reuses the exact same page and guard.

## Consequences

- No cross-device "remembered organization" — a user logging in on a different browser/device always sees the picker, by design.
- `useCurrentOrganization` changed from its own query to a derived selector over `useMemberships()` + the organization store, since "current" is no longer server state.
- `organization-errors.ts`'s `already_in_organization` mapping was removed along with the guard that raised it — it's now unreachable.
- If a future phase needs cross-device "remember my last organization," that would mean adding `profiles.last_active_organization_id` (or similar) and changing the login redirect to check it — a deliberate reversal of this ADR's login-always-picks decision, not an extension of it.
