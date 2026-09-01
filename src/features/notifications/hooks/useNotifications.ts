import { useQuery } from "@tanstack/react-query"

import { listNotifications } from "@/features/notifications/services/notification.service"
import { notificationKeys } from "@/features/notifications/lib/query-keys"

export function useNotifications(organizationId: string | undefined, opts: { limit?: number } = {}) {
  return useQuery({
    // notificationKeys.list(organizationId) stays a valid prefix for
    // invalidation regardless of limit, since limit is appended after it.
    queryKey: [...notificationKeys.list(organizationId), opts.limit ?? null],
    queryFn: () => listNotifications(organizationId!, opts),
    enabled: !!organizationId,
  })
}
