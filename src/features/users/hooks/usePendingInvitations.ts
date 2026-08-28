import { useQuery } from "@tanstack/react-query"

import { listPendingInvitations } from "@/features/users/services/invitation.service"
import { userKeys } from "@/features/users/lib/query-keys"

export function usePendingInvitations(organizationId: string | undefined) {
  return useQuery({
    queryKey: userKeys.invitations(organizationId),
    queryFn: () => listPendingInvitations(organizationId!),
    enabled: !!organizationId,
  })
}
