import { useQuery } from "@tanstack/react-query"

import { getProfile } from "@/features/auth/services/profile.service"
import { useAuthStore } from "@/features/auth/stores/authStore"

export function useProfile() {
  const userId = useAuthStore((state) => state.session?.user.id)

  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  })
}
