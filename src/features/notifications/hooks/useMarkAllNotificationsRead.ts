import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { markAllNotificationsRead } from "@/features/notifications/services/notification.service"
import { notificationKeys } from "@/features/notifications/lib/query-keys"

export function useMarkAllNotificationsRead(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => markAllNotificationsRead(organizationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list(organizationId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.recent(organizationId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(organizationId) })
      toast.success("All notifications marked as read.")
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  })
}
