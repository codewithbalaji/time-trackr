import { useQuery } from "@tanstack/react-query"

import { getProfile } from "@/features/auth/services/profile.service"
import { useAuthStore } from "@/features/auth/stores/authStore"
import { authKeys } from "@/features/auth/lib/query-keys"

export function useProfile() {
  const userId = useAuthStore((state) => state.session?.user.id)

  return useQuery({
    queryKey: authKeys.profile(userId),
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  })
}
