import { useQuery } from "@tanstack/react-query"

import { getMembershipsForUser } from "@/features/organizations/services/organization.service"
import { organizationKeys } from "@/features/organizations/lib/query-keys"
import { useAuthStore } from "@/features/auth/stores/authStore"

export function useMemberships() {
  const userId = useAuthStore((state) => state.session?.user.id)

  return useQuery({
    queryKey: organizationKeys.memberships(userId),
    queryFn: () => getMembershipsForUser(userId!),
    enabled: !!userId,
  })
}
