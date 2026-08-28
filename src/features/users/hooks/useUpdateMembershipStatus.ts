import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { updateMembershipStatus } from "@/features/users/services/membership.service"
import { mapOrganizationError } from "@/features/organizations/services/organization-errors"
import { userKeys } from "@/features/users/lib/query-keys"

export function useUpdateMembershipStatus(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      membershipId,
      status,
    }: {
      membershipId: string
      status: "active" | "suspended"
    }) => updateMembershipStatus(membershipId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.members(organizationId) })
    },
    onError: (error: PostgrestError) => toast.error(mapOrganizationError(error)),
  })
}
