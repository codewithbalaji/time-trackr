import { useQuery } from "@tanstack/react-query"

import { getUnreadNotificationCount } from "@/features/notifications/services/notification.service"
import { notificationKeys } from "@/features/notifications/lib/query-keys"

export function useUnreadNotificationCount(organizationId: string | undefined) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(organizationId),
    queryFn: () => getUnreadNotificationCount(organizationId!),
    enabled: !!organizationId,
  })
}
