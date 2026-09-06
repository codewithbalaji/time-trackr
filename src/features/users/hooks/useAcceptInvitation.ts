import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { acceptInvitation } from "@/features/users/services/invitation.service"
import { mapOrganizationError } from "@/features/organizations/services/organization-errors"
import { organizationKeys } from "@/features/organizations/lib/query-keys"
import { userKeys } from "@/features/users/lib/query-keys"
import { useAuthStore } from "@/features/auth/stores/authStore"
import { setCurrentOrganizationId } from "@/features/organizations/stores/organizationStore"

export function useAcceptInvitation() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.session?.user.id)

  return useMutation({
    mutationFn: acceptInvitation,
    onSuccess: (membership) => {
      // accept_invitation raises rather than returning null on every failure
      // path it knows about, but this reads a field off an RPC result — guard
      // it rather than throwing a TypeError inside a success handler.
      if (membership?.organization_id) {
        setCurrentOrganizationId(membership.organization_id)
      }
      queryClient.invalidateQueries({ queryKey: organizationKeys.memberships(userId) })
      queryClient.invalidateQueries({ queryKey: userKeys.pendingInvitationsForMe(userId) })
    },
    onError: (error: PostgrestError) => toast.error(mapOrganizationError(error)),
  })
}
