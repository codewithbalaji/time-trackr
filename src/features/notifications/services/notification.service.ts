import { supabase } from "@/lib/supabase"

export type Notification = {
  id: string
  organization_id: string
  recipient_id: string
  actor_id: string | null
  type: string
  target_type: string
  target_id: string | null
  link: string | null
  title: string
  body: string | null
  metadata: Record<string, unknown>
  read_at: string | null
  created_at: string
}

const NOTIFICATION_COLUMNS =
  "id, organization_id, recipient_id, actor_id, type, target_type, target_id, link, title, body, metadata, read_at, created_at"

// RLS already scopes rows to the current user (recipient_id = auth.uid()) —
// organization_id is filtered explicitly anyway so switching orgs shows
// only that org's notifications, same as every other org-scoped query.
export async function listNotifications(
  organizationId: string,
  opts: { limit?: number } = {}
): Promise<Notification[]> {
  const { limit = 20 } = opts
  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as unknown as Notification[]
}

export async function listRecentNotifications(
  organizationId: string,
  limit = 8
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as unknown as Notification[]
}

export async function getUnreadNotificationCount(organizationId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("read_at", null)
  if (error) throw error
  return count ?? 0
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null)
  if (error) throw error
}

export async function markAllNotificationsRead(organizationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .is("read_at", null)
  if (error) throw error
}
