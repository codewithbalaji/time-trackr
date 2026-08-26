import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AuthError } from "@supabase/supabase-js"

import { signUp } from "@/features/auth/services/auth.service"
import { mapAuthError } from "@/features/auth/services/auth-errors"

export function useSignup() {
  return useMutation({
    mutationFn: signUp,
    onError: (error: AuthError) => toast.error(mapAuthError(error)),
  })
}
