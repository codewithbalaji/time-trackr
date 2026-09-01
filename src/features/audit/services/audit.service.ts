import { supabase } from "@/lib/supabase"

export type AuditLogEntry = {
  id: string
  created_at: string
  actor: { full_name: string | null; email: string } | null
  action: string
  target_type: string
  target_id: string | null
  metadata: Record<string, unknown>
}

type AuditLogRow = {
  id: string
  created_at: string
  actor_id: string | null
  action: string
  target_type: string
  target_id: string | null
  metadata: Record<string, unknown>
}

const AUDIT_LOG_COLUMNS = "id, created_at, actor_id, action, target_type, target_id, metadata"

// audit_logs.actor_id references auth.users, not profiles, so PostgREST can't
// embed a profile join directly — resolve actor names with a second batched
// query instead, same approach as approval.service.ts's listTimesheetHistory.
export async function listAuditLogs(
  organizationId: string,
  opts: { limit?: number } = {}
): Promise<AuditLogEntry[]> {
  const { limit = 20 } = opts
  const { data, error } = await supabase
    .from("audit_logs")
    .select(AUDIT_LOG_COLUMNS)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error

  const rows = data as unknown as AuditLogRow[]
  const actorIds = [...new Set(rows.map((row) => row.actor_id).filter((id): id is string => !!id))]

  const actorsById = new Map<string, { full_name: string | null; email: string }>()
  if (actorIds.length > 0) {
    const { data: actors, error: actorsError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", actorIds)
    if (actorsError) throw actorsError
    for (const actor of actors) {
      actorsById.set(actor.id, { full_name: actor.full_name, email: actor.email })
    }
  }

  return rows.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    actor: row.actor_id ? (actorsById.get(row.actor_id) ?? null) : null,
    action: row.action,
    target_type: row.target_type,
    target_id: row.target_id,
    metadata: row.metadata,
  }))
}
