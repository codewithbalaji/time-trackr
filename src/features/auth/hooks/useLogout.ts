import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AuthError } from "@supabase/supabase-js"

import { signOut } from "@/features/auth/services/auth.service"
import { mapAuthError } from "@/features/auth/services/auth-errors"
import { clearCurrentOrganizationId } from "@/features/organizations/stores/organizationStore"

// No manual session-store clearing here: supabase.auth.onAuthStateChange
// (wired up in authStore's initAuthStore) is the single source of truth for
// session state. The organization picker's tab-scoped pick is different —
// nothing else clears it, so it's done explicitly here (see
// docs/decisions/0003-multi-organization-selection.md).
export function useLogout() {
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => clearCurrentOrganizationId(),
    onError: (error: AuthError) => toast.error(mapAuthError(error)),
  })
}
