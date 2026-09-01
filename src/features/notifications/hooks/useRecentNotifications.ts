import { useQuery } from "@tanstack/react-query"

import { listRecentNotifications } from "@/features/notifications/services/notification.service"
import { notificationKeys } from "@/features/notifications/lib/query-keys"

export function useRecentNotifications(organizationId: string | undefined) {
  return useQuery({
    queryKey: notificationKeys.recent(organizationId),
    queryFn: () => listRecentNotifications(organizationId!),
    enabled: !!organizationId,
  })
}
