import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { createInvitation } from "@/features/users/services/invitation.service"
import { mapOrganizationError } from "@/features/organizations/services/organization-errors"
import { userKeys } from "@/features/users/lib/query-keys"

export function useCreateInvitation(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createInvitation,
    // Invalidated on failure as well as success: a send failure now keeps the
    // invitation row (so the audit trail and the Resend button survive a
    // transient email outage), which means the pending list changed either way.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.invitations(organizationId) })
    },
    onError: (error: PostgrestError) => toast.error(mapOrganizationError(error)),
  })
}
