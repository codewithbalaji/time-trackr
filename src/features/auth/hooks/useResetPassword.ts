import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { updatePassword } from "@/features/auth/services/auth.service"
import { mapAuthError } from "@/features/auth/services/auth-errors"

export function useResetPassword() {
  return useMutation({
    mutationFn: updatePassword,
    // `unknown`, not AuthError: TanStack types this as Error, and a
    // network failure rejects with a bare TypeError. mapAuthError handles both.
    onError: (error: unknown) => toast.error(mapAuthError(error)),
  })
}
