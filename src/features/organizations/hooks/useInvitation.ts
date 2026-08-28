import { useQuery } from "@tanstack/react-query"

import { getInvitationByToken } from "@/features/organizations/services/invitation.service"
import { invitationKeys } from "@/features/organizations/lib/query-keys"

export function useInvitation(token: string | undefined) {
  return useQuery({
    queryKey: invitationKeys.byToken(token),
    queryFn: () => getInvitationByToken(token!),
    enabled: !!token,
  })
}
