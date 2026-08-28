import { useMemberships } from "@/features/organizations/hooks/useMemberships"
import { useOrganizationStore } from "@/features/organizations/stores/organizationStore"

// The membership matching this browser tab's current organization pick (see
// organizationStore) — a plain derived selector, not its own query, since the
// membership list is already fetched by useMemberships.
export function useCurrentOrganization() {
  const { data: memberships } = useMemberships()
  const currentOrganizationId = useOrganizationStore((state) => state.currentOrganizationId)

  return memberships?.find((m) => m.organization.id === currentOrganizationId) ?? null
}
