import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { createOrganizationWithOwner } from "@/features/organizations/services/organization.service"
import { mapOrganizationError } from "@/features/organizations/services/organization-errors"
import { organizationKeys } from "@/features/organizations/lib/query-keys"
import { useAuthStore } from "@/features/auth/stores/authStore"
import { setCurrentOrganizationId } from "@/features/organizations/stores/organizationStore"

// Shared by the onboarding form (a brand-new user's first organization) and
// the "create new organization" action on the organization picker (an
// existing user adding another one) — creating an organization works the
// same way either time.
export function useCreateOrganization() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.session?.user.id)

  return useMutation({
    mutationFn: createOrganizationWithOwner,
    onSuccess: (organization) => {
      setCurrentOrganizationId(organization.id)
      queryClient.invalidateQueries({ queryKey: organizationKeys.memberships(userId) })
    },
    onError: (error: PostgrestError) => toast.error(mapOrganizationError(error)),
  })
}
