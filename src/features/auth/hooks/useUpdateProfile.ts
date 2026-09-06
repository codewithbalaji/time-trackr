import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { updateProfile } from "@/features/auth/services/profile.service"
import { mapOrganizationError } from "@/features/organizations/services/organization-errors"
import { authKeys } from "@/features/auth/lib/query-keys"
import { useAuthStore } from "@/features/auth/stores/authStore"

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.session?.user.id)

  return useMutation({
    mutationFn: (fullName: string) => updateProfile(userId!, { full_name: fullName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.profile(userId) })
      // The Members directory renders profiles.full_name too, and was left
      // showing the old name until something else happened to refetch it.
      // Matched on the key prefix rather than a specific organization: this
      // hook has no business knowing which one is selected, and a name change
      // is visible in every organization the user belongs to.
      queryClient.invalidateQueries({ queryKey: ["org-members"] })
      toast.success("Profile updated.")
    },
    // Not error.message: that's raw Postgres text (an RLS refusal, a constraint
    // name) going straight onto the screen, which auth-errors.ts explicitly
    // warns against.
    onError: (error: PostgrestError) => toast.error(mapOrganizationError(error)),
  })
}
