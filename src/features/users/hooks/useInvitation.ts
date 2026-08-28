import { useQuery } from "@tanstack/react-query"

import { getInvitationByToken } from "@/features/users/services/invitation.service"
import { invitationKeys } from "@/features/users/lib/query-keys"

export function useInvitation(token: string | undefined) {
  return useQuery({
    queryKey: invitationKeys.byToken(token),
    queryFn: () => getInvitationByToken(token!),
    enabled: !!token,
  })
}
