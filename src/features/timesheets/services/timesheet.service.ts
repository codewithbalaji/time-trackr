import { supabase } from "@/lib/supabase"
import type { TimeEntry } from "@/features/time-tracking/services/time-entry.service"

export type Timesheet = {
  id: string
  period_start: string
  period_end: string
  status: "draft" | "submitted"
  submitted_at: string | null
}

const TIMESHEET_COLUMNS = "id, period_start, period_end, status, submitted_at"

export async function getTimesheet(
  organizationId: string,
  userId: string,
  periodStart: string
): Promise<Timesheet | null> {
  const { data, error } = await supabase
    .from("timesheets")
    .select(TIMESHEET_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("period_start", periodStart)
    .maybeSingle()
  if (error) throw error
  return data as unknown as Timesheet | null
}

const PERIOD_ENTRY_COLUMNS =
  "id, description, start_time, end_time, duration_seconds, created_at, project:projects(id, name, color)"

export async function listEntriesForPeriod(
  organizationId: string,
  userId: string,
  periodStartIso: string,
  periodEndExclusiveIso: string
): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from("time_entries")
    .select(PERIOD_ENTRY_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .gte("start_time", periodStartIso)
    .lt("start_time", periodEndExclusiveIso)
    .order("start_time", { ascending: true })
  if (error) throw error
  return data as unknown as TimeEntry[]
}

export async function submitTimesheet(
  organizationId: string,
  periodStart: string
): Promise<Timesheet> {
  const { data, error } = await supabase.rpc("submit_timesheet", {
    p_organization_id: organizationId,
    p_period_start: periodStart,
  })
  if (error) throw error
  return data as Timesheet
}

export async function withdrawTimesheet(
  organizationId: string,
  periodStart: string
): Promise<Timesheet> {
  const { data, error } = await supabase.rpc("withdraw_timesheet", {
    p_organization_id: organizationId,
    p_period_start: periodStart,
  })
  if (error) throw error
  return data as Timesheet
}
