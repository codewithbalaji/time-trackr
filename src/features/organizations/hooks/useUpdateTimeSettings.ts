import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { updateOrganizationTimeSettings } from "@/features/organizations/services/organization.service"
import { mapOrganizationError } from "@/features/organizations/services/organization-errors"
import { organizationKeys } from "@/features/organizations/lib/query-keys"
import { useAuthStore } from "@/features/auth/stores/authStore"
import type { UpdateTimeSettingsInput } from "@/features/organizations/schemas/update-time-settings.schema"

export function useUpdateTimeSettings(organizationId: string | undefined) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.session?.user.id)

  return useMutation({
    mutationFn: (input: UpdateTimeSettingsInput) =>
      updateOrganizationTimeSettings(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.memberships(userId) })
      toast.success("Time settings updated.")
    },
    onError: (error: PostgrestError) => toast.error(mapOrganizationError(error)),
  })
}
