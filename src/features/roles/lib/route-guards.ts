import { redirect } from "react-router"

import { requireSession } from "@/features/auth/lib/route-guards"
import { useOrganizationStore } from "@/features/organizations/stores/organizationStore"
import { queryClient } from "@/lib/queryClient"
import { hasPermission } from "@/features/roles/services/role.service"
import { roleKeys } from "@/features/roles/lib/query-keys"

// Guards a route behind a permission key, e.g. requirePermission("organization.manage_settings")
// on /settings. Like organizations/lib/route-guards.ts, uses fetchQuery (not
// ensureQueryData) so a role change takes effect on the very next navigation
// rather than trusting a stale cached permission check.
export function requirePermission(permissionKey: string) {
  return async function loader() {
    requireSession()
    const organizationId = useOrganizationStore.getState().currentOrganizationId
    if (!organizationId) {
      throw redirect("/select-organization")
    }

    const allowed = await queryClient.fetchQuery({
      queryKey: roleKeys.permission(organizationId, permissionKey),
      queryFn: () => hasPermission(organizationId, permissionKey),
    })
    if (!allowed) {
      throw redirect("/")
    }
    return null
  }
}
