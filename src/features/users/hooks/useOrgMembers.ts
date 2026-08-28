import { useQuery } from "@tanstack/react-query"

import { listOrgMembers } from "@/features/users/services/membership.service"
import { userKeys } from "@/features/users/lib/query-keys"

export function useOrgMembers(organizationId: string | undefined) {
  return useQuery({
    queryKey: userKeys.members(organizationId),
    queryFn: () => listOrgMembers(organizationId!),
    enabled: !!organizationId,
  })
}
