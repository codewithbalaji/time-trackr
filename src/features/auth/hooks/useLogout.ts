import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AuthError } from "@supabase/supabase-js"

import { signOut } from "@/features/auth/services/auth.service"
import { mapAuthError } from "@/features/auth/services/auth-errors"

// No manual store clearing here: supabase.auth.onAuthStateChange (wired up in
// authStore's initAuthStore) is the single source of truth for session state.
export function useLogout() {
  return useMutation({
    mutationFn: signOut,
    onError: (error: AuthError) => toast.error(mapAuthError(error)),
  })
}
