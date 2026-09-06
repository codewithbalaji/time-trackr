import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { updateOrganizationName } from "@/features/organizations/services/organization.service"
import { mapOrganizationError } from "@/features/organizations/services/organization-errors"
import { organizationKeys } from "@/features/organizations/lib/query-keys"
import { useAuthStore } from "@/features/auth/stores/authStore"

export function useUpdateOrganizationName(organizationId: string | undefined) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.session?.user.id)

  return useMutation({
    mutationFn: (name: string) => updateOrganizationName(organizationId!, name),
    onSuccess: () => {
      // The name is read off the memberships query everywhere it appears (the
      // sidebar, the organization picker, this page), so that's the only cache
      // that needs dropping.
      queryClient.invalidateQueries({ queryKey: organizationKeys.memberships(userId) })
      toast.success("Organization name updated.")
    },
    onError: (error: PostgrestError) => toast.error(mapOrganizationError(error)),
  })
}
