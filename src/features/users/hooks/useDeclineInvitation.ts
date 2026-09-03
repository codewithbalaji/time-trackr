import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { declineInvitation } from "@/features/users/services/invitation.service"
import { mapOrganizationError } from "@/features/organizations/services/organization-errors"
import { userKeys } from "@/features/users/lib/query-keys"
import { useAuthStore } from "@/features/auth/stores/authStore"

export function useDeclineInvitation() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.session?.user.id)

  return useMutation({
    mutationFn: declineInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.pendingInvitationsForMe(userId) })
    },
    onError: (error: PostgrestError) => toast.error(mapOrganizationError(error)),
  })
}
