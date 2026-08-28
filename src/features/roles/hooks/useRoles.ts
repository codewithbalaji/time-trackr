import { useQuery } from "@tanstack/react-query"

import { listRoles } from "@/features/roles/services/role.service"
import { roleKeys } from "@/features/roles/lib/query-keys"

export function useRoles(organizationId: string | undefined) {
  return useQuery({
    queryKey: roleKeys.list(organizationId),
    queryFn: () => listRoles(organizationId!),
    enabled: !!organizationId,
  })
}
