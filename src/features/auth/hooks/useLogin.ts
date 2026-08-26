import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AuthError } from "@supabase/supabase-js"

import { signInWithPassword } from "@/features/auth/services/auth.service"
import { mapAuthError } from "@/features/auth/services/auth-errors"

export function useLogin() {
  return useMutation({
    mutationFn: signInWithPassword,
    onError: (error: AuthError) => toast.error(mapAuthError(error)),
  })
}
