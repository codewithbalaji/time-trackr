import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCurrentOrganization } from "@/features/organizations/hooks/useCurrentOrganization"
import { useNotifications } from "@/features/notifications/hooks/useNotifications"
import { useUnreadNotificationCount } from "@/features/notifications/hooks/useUnreadNotificationCount"
import { useMarkAllNotificationsRead } from "@/features/notifications/hooks/useMarkAllNotificationsRead"
import { NotificationList } from "@/features/notifications/components/NotificationList"

const PAGE_SIZE = 20

export function NotificationsPage() {
  const membership = useCurrentOrganization()
  const organizationId = membership?.organization.id
  const [limit, setLimit] = useState(PAGE_SIZE)

  const { data: notifications, isLoading } = useNotifications(organizationId, { limit })
  const { data: unreadCount } = useUnreadNotificationCount(organizationId)
  const markAllRead = useMarkAllNotificationsRead(organizationId)
  const hasUnread = !!unreadCount && unreadCount > 0

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approval updates, submissions, and reminders relevant to you.
          </p>
        </div>
        {hasUnread && (
          <Button variant="outline" disabled={markAllRead.isPending} onClick={() => markAllRead.mutate()}>
            Mark all read
          </Button>
        )}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            organizationId={organizationId}
            emptyMessage="No notifications yet."
          />
          {notifications && notifications.length >= limit && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" size="sm" onClick={() => setLimit((current) => current + PAGE_SIZE)}>
                Load more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
