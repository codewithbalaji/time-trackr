import { useQuery } from "@tanstack/react-query"

import { listMyPermissions } from "@/features/roles/services/role.service"
import { roleKeys } from "@/features/roles/lib/query-keys"
import { useAuthStore } from "@/features/auth/stores/authStore"

// Shared by every useHasPermission() call for a given org — React Query
// dedupes identical queryKeys, so N permission checks on one page cost one
// network round trip instead of N.
export function useMyPermissions(organizationId: string | undefined) {
  const userId = useAuthStore((state) => state.session?.user.id)

  return useQuery({
    queryKey: roleKeys.mine(organizationId, userId),
    queryFn: () => listMyPermissions(organizationId!, userId!),
    enabled: !!organizationId && !!userId,
  })
}
