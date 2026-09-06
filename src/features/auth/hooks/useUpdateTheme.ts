import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { updateProfile } from "@/features/auth/services/profile.service"
import { authKeys } from "@/features/auth/lib/query-keys"
import { useAuthStore } from "@/features/auth/stores/authStore"
import type { Theme } from "@/hooks/theme-context"

// Persists the colour scheme to the profile so it follows the user to their
// next device. Deliberately quiet on success — the change is already visible
// on screen, and a toast for every sidebar toggle would be noise.
export function useUpdateTheme() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.session?.user.id)

  return useMutation({
    mutationFn: (theme: Theme) => updateProfile(userId!, { theme }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.profile(userId) })
    },
    // The theme still applied locally, so this is a "won't follow you" warning
    // rather than a failure.
    onError: () =>
      toast.error("Your theme was applied here, but couldn't be saved to your account."),
  })
}
