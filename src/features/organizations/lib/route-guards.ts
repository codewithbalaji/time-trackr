import { redirect } from "react-router"

import { requireSession } from "@/features/auth/lib/route-guards"
import { useAuthStore } from "@/features/auth/stores/authStore"
import { queryClient } from "@/lib/queryClient"
import { getMembershipsForUser } from "@/features/organizations/services/organization.service"
import { organizationKeys } from "@/features/organizations/lib/query-keys"
import { useOrganizationStore } from "@/features/organizations/stores/organizationStore"
import { listPendingInvitationsForCurrentUser } from "@/features/users/services/invitation.service"
import { userKeys } from "@/features/users/lib/query-keys"

// Unlike the auth guards, this must hit Supabase (org membership isn't session
// data, so it isn't in the thin authStore) — loaders can be async, so we query
// through the shared queryClient. Uses fetchQuery (not ensureQueryData) so this
// always re-checks membership on navigation rather than trusting a stale cached
// result left over from before onboarding/invite-accept completed —
// ensureQueryData would happily return that stale value since nothing is
// actively subscribed to this query to trigger a background refetch.
async function getMemberships() {
  const userId = useAuthStore.getState().session!.user.id
  return queryClient.fetchQuery({
    queryKey: organizationKeys.memberships(userId),
    queryFn: () => getMembershipsForUser(userId),
  })
}

// Same re-check-on-every-navigation reasoning as getMemberships above — a
// pending invite arriving (or being accepted/declined) mid-session must be
// reflected on the next navigation, not read from a stale cache.
async function getPendingInvitations() {
  const user = useAuthStore.getState().session!.user
  return queryClient.fetchQuery({
    queryKey: userKeys.pendingInvitationsForMe(user.id),
    queryFn: () => listPendingInvitationsForCurrentUser(user.email!),
  })
}

// Guards the dashboard and everything else inside ProtectedLayout: needs both
// at least one membership AND an organization picked for this browser tab
// (organizationStore) — a fresh login always clears/never had that pick (see
// docs/decisions/0003-multi-organization-selection.md), so this is what sends
// a just-logged-in user to the picker even though they already have an org.
export async function requireOrganization() {
  requireSession()
  const memberships = await getMemberships()
  if (memberships.length === 0) {
    throw redirect("/onboarding")
  }
  const currentOrganizationId = useOrganizationStore.getState().currentOrganizationId
  const selected = memberships.find(
    (membership) => membership.organization.id === currentOrganizationId
  )
  // Re-checked on every navigation (see getMemberships' fetchQuery comment
  // above), so a member suspended mid-session gets sent back to the picker
  // — which shows their suspended orgs disabled — on their very next
  // navigation, instead of the app silently rendering empty/broken pages
  // for someone whose access RLS has already revoked.
  if (!selected || selected.status !== "active") {
    throw redirect("/select-organization")
  }
  return null
}

export async function redirectIfOnboarded() {
  requireSession()
  const memberships = await getMemberships()
  if (memberships.length > 0) {
    throw redirect("/")
  }
  // A user with zero memberships but a pending invite (e.g. they already had
  // an account before being invited — see
  // supabase/migrations/20260914090000_existing_user_invite_flow.sql)
  // belongs on the invite picker, not funneled into creating their own org.
  const pendingInvitations = await getPendingInvitations()
  if (pendingInvitations.length > 0) {
    throw redirect("/select-organization")
  }
  return null
}

// Guards /select-organization: reachable any time a signed-in user has at
// least one membership (not just right after login — this is also where the
// sidebar's "switch organization" action lands) or a pending invitation to
// accept/decline. A session with neither has nothing to pick from and
// belongs in onboarding instead.
export async function requireMemberships() {
  requireSession()
  const memberships = await getMemberships()
  if (memberships.length === 0) {
    const pendingInvitations = await getPendingInvitations()
    if (pendingInvitations.length === 0) {
      throw redirect("/onboarding")
    }
  }
  return memberships
}
