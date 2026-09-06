import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { signInWithPassword } from "@/features/auth/services/auth.service"
import { mapAuthError } from "@/features/auth/services/auth-errors"

export function useLogin() {
  return useMutation({
    mutationFn: signInWithPassword,
    // `unknown`, not AuthError: TanStack types this as Error, and a
    // network failure rejects with a bare TypeError. mapAuthError handles both.
    onError: (error: unknown) => toast.error(mapAuthError(error)),
  })
}
