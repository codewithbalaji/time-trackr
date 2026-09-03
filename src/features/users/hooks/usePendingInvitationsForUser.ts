import { useQuery } from "@tanstack/react-query"

import { listPendingInvitationsForCurrentUser } from "@/features/users/services/invitation.service"
import { userKeys } from "@/features/users/lib/query-keys"
import { useAuthStore } from "@/features/auth/stores/authStore"

export function usePendingInvitationsForUser() {
  const userId = useAuthStore((state) => state.session?.user.id)
  const email = useAuthStore((state) => state.session?.user.email)

  return useQuery({
    queryKey: userKeys.pendingInvitationsForMe(userId),
    queryFn: () => listPendingInvitationsForCurrentUser(email!),
    enabled: !!userId && !!email,
  })
}
