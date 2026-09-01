import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import { notificationKeys } from "@/features/notifications/lib/query-keys"
import type { Notification } from "@/features/notifications/services/notification.service"

const RECENT_LIMIT = 8

// First use of Supabase Realtime in this codebase — mount once (in
// ProtectedLayout, alongside useRunningTimeEntry), not inside NotificationBell,
// so there's exactly one channel per session regardless of whether the
// popover is open. Filtering by recipient_id only (not also organization_id)
// keeps a single subscription across org switches; the query-cache keys
// used below are already organization-scoped, so an event for a
// non-selected org just updates cache that isn't currently being rendered.
export function useNotificationsRealtime(
  organizationId: string | undefined,
  userId: string | undefined
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!organizationId || !userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        (payload) => {
          const notification = payload.new as Notification
          if (notification.organization_id !== organizationId) return

          // Cheap, deterministic patch for the small/bounded surfaces
          // (popover + badge) instead of a refetch; the paginated full-page
          // list is just invalidated since hand-patching a limit-bound list
          // isn't worth it.
          queryClient.setQueryData<Notification[]>(
            notificationKeys.recent(organizationId),
            (old) => [notification, ...(old ?? [])].slice(0, RECENT_LIMIT)
          )
          queryClient.setQueryData<number>(
            notificationKeys.unreadCount(organizationId),
            (old) => (old ?? 0) + 1
          )
          queryClient.invalidateQueries({ queryKey: notificationKeys.list(organizationId) })
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        () => {
          // Read-state changes (including "mark all read" from another tab)
          // are low-volume — just invalidate rather than hand-patch.
          queryClient.invalidateQueries({ queryKey: notificationKeys.recent(organizationId) })
          queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(organizationId) })
          queryClient.invalidateQueries({ queryKey: notificationKeys.list(organizationId) })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId, userId, queryClient])
}
