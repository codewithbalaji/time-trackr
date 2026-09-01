import { supabase } from "@/lib/supabase"

// Report-shaped time entry: the columns time-tracking/timesheets already
// select, plus the client (for the "top client" stat/donut) and the owning
// user's profile (for team-scope views). Deliberately its own shape rather
// than `TimeEntry & { user_id: string }` (the plan's original sketch) —
// TimeEntry's `project` field doesn't carry `client`, so extending it would
// conflict; this is structurally compatible with TimeEntry everywhere else.
export type ReportEntry = {
  id: string
  user_id: string
  description: string
  start_time: string
  end_time: string | null
  duration_seconds: number | null
  created_at: string
  project: {
    id: string
    name: string
    color: string
    client: { id: string; name: string } | null
  }
  user: { id: string; full_name: string | null; email: string }
}

// time_entries.user_id has a single FK to profiles (unlike timesheets.user_id
// / reviewed_by, which both point there and need `!fk_name` disambiguation —
// see approval.service.ts), so this embed doesn't need one.
const REPORT_ENTRY_COLUMNS =
  "id, user_id, description, start_time, end_time, duration_seconds, created_at, " +
  "project:projects(id, name, color, client:clients(id, name)), user:profiles(id, full_name, email)"

export async function listOwnEntriesInRange(
  organizationId: string,
  userId: string,
  startIso: string,
  endExclusiveIso: string
): Promise<ReportEntry[]> {
  const { data, error } = await supabase
    .from("time_entries")
    .select(REPORT_ENTRY_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .gte("start_time", startIso)
    .lt("start_time", endExclusiveIso)
    .not("end_time", "is", null) // exclude the currently-running entry
    .order("start_time", { ascending: true })
  if (error) throw error
  return data as unknown as ReportEntry[]
}

// Org-wide range query for the Dashboard's team view and Reports' team-member
// filter. Authorization is entirely the Phase 8 RLS policy "Members with
// timesheets.approve can view any time entries in their org" — this function
// never re-checks the permission itself (RLS is the real boundary, per
// docs/security.md); the hooks that wrap it are only ever invoked from UI
// already gated by useHasPermission, for UX purposes only.
export async function listOrgEntriesInRange(
  organizationId: string,
  startIso: string,
  endExclusiveIso: string
): Promise<ReportEntry[]> {
  const { data, error } = await supabase
    .from("time_entries")
    .select(REPORT_ENTRY_COLUMNS)
    .eq("organization_id", organizationId)
    .gte("start_time", startIso)
    .lt("start_time", endExclusiveIso)
    .not("end_time", "is", null)
    .order("start_time", { ascending: true })
  if (error) throw error
  return data as unknown as ReportEntry[]
}
