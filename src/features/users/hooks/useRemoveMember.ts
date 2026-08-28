import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { removeMember } from "@/features/users/services/membership.service"
import { mapOrganizationError } from "@/features/organizations/services/organization-errors"
import { userKeys } from "@/features/users/lib/query-keys"

export function useRemoveMember(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.members(organizationId) })
    },
    onError: (error: PostgrestError) => toast.error(mapOrganizationError(error)),
  })
}
