import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AuthError } from "@supabase/supabase-js"

import { updatePassword } from "@/features/auth/services/auth.service"
import { mapAuthError } from "@/features/auth/services/auth-errors"

export function useResetPassword() {
  return useMutation({
    mutationFn: updatePassword,
    onError: (error: AuthError) => toast.error(mapAuthError(error)),
  })
}
