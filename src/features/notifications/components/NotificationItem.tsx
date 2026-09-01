import { formatDistanceToNowStrict } from "date-fns"
import { useNavigate } from "react-router"
import { Bell, CheckCircle2, ClipboardCheck, Clock, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMarkNotificationRead } from "@/features/notifications/hooks/useMarkNotificationRead"
import type { Notification } from "@/features/notifications/services/notification.service"

const TYPE_ICON: Record<string, typeof Bell> = {
  timesheet_submitted: ClipboardCheck,
  timesheet_approved: CheckCircle2,
  timesheet_rejected: XCircle,
  timesheet_reminder_employee: Clock,
  timesheet_reminder_approver: Clock,
}

export function NotificationItem({
  notification,
  organizationId,
  onNavigate,
}: {
  notification: Notification
  organizationId: string | undefined
  onNavigate?: () => void
}) {
  const navigate = useNavigate()
  const markRead = useMarkNotificationRead(organizationId)
  const Icon = TYPE_ICON[notification.type] ?? Bell
  const isUnread = !notification.read_at

  function handleClick() {
    if (isUnread) markRead.mutate(notification.id)
    onNavigate?.()
    if (notification.link) navigate(notification.link)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted",
        isUnread && "bg-accent/60"
      )}
    >
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{notification.title}</span>
          {isUnread && (
            <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          )}
        </span>
        {notification.body && (
          <span className="mt-0.5 block truncate text-sm text-muted-foreground">
            {notification.body}
          </span>
        )}
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {formatDistanceToNowStrict(new Date(notification.created_at), { addSuffix: true })}
        </span>
      </span>
    </button>
  )
}
