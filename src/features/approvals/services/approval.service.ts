import { supabase } from "@/lib/supabase"
import type { Timesheet } from "@/features/timesheets/services/timesheet.service"

export type PendingTimesheet = {
  id: string
  period_start: string
  period_end: string
  status: "submitted"
  submitted_at: string
  user: { id: string; full_name: string | null; email: string }
}

// timesheets has two FKs to profiles (user_id and reviewed_by), so the
// embed must name the constraint explicitly — otherwise PostgREST returns
// PGRST201 ("more than one relationship was found") and the query errors.
const PENDING_TIMESHEET_COLUMNS =
  "id, period_start, period_end, status, submitted_at, user:profiles!timesheets_user_id_fkey(id, full_name, email)"

// Org-wide queue, oldest submission first — approver scope is a permission
// (timesheets.approve), not a manager relationship, so this deliberately
// isn't scoped to "my team".
export async function listPendingTimesheets(organizationId: string): Promise<PendingTimesheet[]> {
  const { data, error } = await supabase
    .from("timesheets")
    .select(PENDING_TIMESHEET_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true })
  if (error) throw error
  return data as unknown as PendingTimesheet[]
}

export async function approveTimesheet(
  organizationId: string,
  userId: string,
  periodStart: string
): Promise<Timesheet> {
  const { data, error } = await supabase.rpc("approve_timesheet", {
    p_organization_id: organizationId,
    p_user_id: userId,
    p_period_start: periodStart,
  })
  if (error) throw error
  return data as Timesheet
}

export async function rejectTimesheet(
  organizationId: string,
  userId: string,
  periodStart: string,
  reason: string
): Promise<Timesheet> {
  const { data, error } = await supabase.rpc("reject_timesheet", {
    p_organization_id: organizationId,
    p_user_id: userId,
    p_period_start: periodStart,
    p_reason: reason,
  })
  if (error) throw error
  return data as Timesheet
}

export type ApprovalHistoryEntry = {
  id: string
  created_at: string
  actor: { full_name: string | null; email: string } | null
  status: string | null
  rejection_reason: string | null
}

type AuditLogRow = {
  id: string
  created_at: string
  actor_id: string | null
  metadata: { status?: string; rejection_reason?: string | null }
}

const AUDIT_LOG_COLUMNS = "id, created_at, actor_id, metadata"

// audit_logs.actor_id references auth.users, not profiles, so PostgREST can't
// embed a profile join directly (unlike timesheets.user_id, which was
// migrated to reference profiles) — resolve actor names with a second query
// instead of adding a new FK just for this display purpose.
export async function listTimesheetHistory(timesheetId: string): Promise<ApprovalHistoryEntry[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select(AUDIT_LOG_COLUMNS)
    .eq("target_type", "timesheets")
    .eq("target_id", timesheetId)
    .order("created_at", { ascending: false })
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
    status: row.metadata?.status ?? null,
    rejection_reason: row.metadata?.rejection_reason ?? null,
  }))
}
