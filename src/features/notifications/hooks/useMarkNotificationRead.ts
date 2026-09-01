import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { markNotificationRead } from "@/features/notifications/services/notification.service"
import { notificationKeys } from "@/features/notifications/lib/query-keys"

export function useMarkNotificationRead(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list(organizationId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.recent(organizationId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(organizationId) })
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  })
}
