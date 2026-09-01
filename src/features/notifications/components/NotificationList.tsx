import { Bell, Loader2 } from "lucide-react"

import { NotificationItem } from "@/features/notifications/components/NotificationItem"
import type { Notification } from "@/features/notifications/services/notification.service"

export function NotificationList({
  notifications,
  isLoading,
  organizationId,
  onNavigate,
  emptyMessage = "You're all caught up.",
}: {
  notifications: Notification[] | undefined
  isLoading: boolean
  organizationId: string | undefined
  onNavigate?: () => void
  emptyMessage?: string
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading...
      </div>
    )
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
        <Bell className="size-5" />
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          organizationId={organizationId}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}
