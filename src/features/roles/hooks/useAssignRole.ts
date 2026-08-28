import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { assignMembershipRole } from "@/features/roles/services/role.service"
import { mapOrganizationError } from "@/features/organizations/services/organization-errors"
import { userKeys } from "@/features/users/lib/query-keys"

export function useAssignRole(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ membershipId, roleId }: { membershipId: string; roleId: string }) =>
      assignMembershipRole(membershipId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.members(organizationId) })
    },
    onError: (error: PostgrestError) => toast.error(mapOrganizationError(error)),
  })
}
