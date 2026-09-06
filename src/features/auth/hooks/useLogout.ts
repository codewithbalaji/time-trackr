import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { signOut } from "@/features/auth/services/auth.service"
import { mapAuthError } from "@/features/auth/services/auth-errors"
import { clearCurrentOrganizationId } from "@/features/organizations/stores/organizationStore"

// No manual session-store clearing here: supabase.auth.onAuthStateChange
// (wired up in authStore's initAuthStore) is the single source of truth for
// session state. The organization picker's tab-scoped pick is different —
// nothing else clears it, so it's done explicitly here (see
// docs/decisions/0003-multi-organization-selection.md).
export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      clearCurrentOrganizationId()
      // The queryClient is a module singleton that outlives the session. Most
      // keys are scoped by user id, but roleKeys.permission is keyed by
      // organization alone and resolves against auth.uid() server-side — so
      // without this the next person to sign in on this tab gets one render of
      // the previous user's cached permissions in the sidebar.
      queryClient.clear()
    },
    // `unknown`, not AuthError: TanStack types this as Error, and a
    // network failure rejects with a bare TypeError. mapAuthError handles both.
    onError: (error: unknown) => toast.error(mapAuthError(error)),
  })
}
