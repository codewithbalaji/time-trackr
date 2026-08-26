import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AuthError } from "@supabase/supabase-js"

import { resetPasswordForEmail } from "@/features/auth/services/auth.service"
import { mapAuthError } from "@/features/auth/services/auth-errors"

export function useForgotPassword() {
  return useMutation({
    mutationFn: resetPasswordForEmail,
    onError: (error: AuthError) => toast.error(mapAuthError(error)),
  })
}
