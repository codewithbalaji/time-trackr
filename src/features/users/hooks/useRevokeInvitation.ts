import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { revokeInvitation } from "@/features/users/services/invitation.service"
import { mapOrganizationError } from "@/features/organizations/services/organization-errors"
import { userKeys } from "@/features/users/lib/query-keys"

export function useRevokeInvitation(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: revokeInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.invitations(organizationId) })
    },
    onError: (error: PostgrestError) => toast.error(mapOrganizationError(error)),
  })
}
