import { useState } from "react"
import { Link } from "react-router"
import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRecentNotifications } from "@/features/notifications/hooks/useRecentNotifications"
import { useUnreadNotificationCount } from "@/features/notifications/hooks/useUnreadNotificationCount"
import { useMarkAllNotificationsRead } from "@/features/notifications/hooks/useMarkAllNotificationsRead"
import { NotificationList } from "@/features/notifications/components/NotificationList"

export function NotificationBell({ organizationId }: { organizationId: string | undefined }) {
  const [open, setOpen] = useState(false)
  const { data: recent, isLoading } = useRecentNotifications(organizationId)
  const { data: unreadCount } = useUnreadNotificationCount(organizationId)
  const markAllRead = useMarkAllNotificationsRead(organizationId)
  const hasUnread = !!unreadCount && unreadCount > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative">
          <Bell className="size-4" />
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <div className="flex items-center justify-between px-1 py-1">
          <span className="text-sm font-medium">Notifications</span>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>
        <NotificationList
          notifications={recent}
          isLoading={isLoading}
          organizationId={organizationId}
          onNavigate={() => setOpen(false)}
        />
        <Link
          to="/notifications"
          onClick={() => setOpen(false)}
          className="mt-1 block rounded-lg px-3 py-2 text-center text-sm text-primary hover:bg-muted"
        >
          View all
        </Link>
      </PopoverContent>
    </Popover>
  )
}
