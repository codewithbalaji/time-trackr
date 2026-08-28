import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { updateProfile } from "@/features/auth/services/profile.service"
import { useAuthStore } from "@/features/auth/stores/authStore"

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.session?.user.id)

  return useMutation({
    mutationFn: (fullName: string) => updateProfile(userId!, fullName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] })
      toast.success("Profile updated.")
    },
    onError: (error: PostgrestError) =>
      toast.error(error.message || "Something went wrong. Please try again."),
  })
}
