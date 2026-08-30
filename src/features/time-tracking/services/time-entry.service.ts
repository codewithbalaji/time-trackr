import { supabase } from "@/lib/supabase"

export type TimeEntry = {
  id: string
  description: string
  start_time: string
  end_time: string | null
  duration_seconds: number | null
  created_at: string
  project: { id: string; name: string; color: string }
}

const TIME_ENTRY_COLUMNS =
  "id, description, start_time, end_time, duration_seconds, created_at, project:projects(id, name, color)"

export async function listTimeEntries(
  organizationId: string,
  userId: string,
  sinceIso: string
): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from("time_entries")
    .select(TIME_ENTRY_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .not("end_time", "is", null)
    .gte("start_time", sinceIso)
    .order("start_time", { ascending: false })
  if (error) throw error
  return data as unknown as TimeEntry[]
}

export async function getRunningTimeEntry(
  organizationId: string,
  userId: string
): Promise<TimeEntry | null> {
  const { data, error } = await supabase
    .from("time_entries")
    .select(TIME_ENTRY_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .is("end_time", null)
    .maybeSingle()
  if (error) throw error
  return data as unknown as TimeEntry | null
}

export async function startTimer(input: {
  organizationId: string
  projectId: string
  description: string
}) {
  const { data, error } = await supabase.rpc("start_time_entry", {
    p_organization_id: input.organizationId,
    p_project_id: input.projectId,
    p_description: input.description,
  })
  if (error) throw error
  return data
}

export async function stopTimer(entryId: string) {
  const { data, error } = await supabase
    .from("time_entries")
    .update({ end_time: new Date().toISOString() })
    .eq("id", entryId)
    .is("end_time", null)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createManualEntry(input: {
  organizationId: string
  userId: string
  projectId: string
  description: string
  startTime: string
  endTime: string
}) {
  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      organization_id: input.organizationId,
      user_id: input.userId,
      project_id: input.projectId,
      description: input.description,
      start_time: input.startTime,
      end_time: input.endTime,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTimeEntry(
  entryId: string,
  input: {
    projectId: string
    description: string
    startTime: string
    endTime?: string
  }
) {
  const { data, error } = await supabase
    .from("time_entries")
    .update({
      project_id: input.projectId,
      description: input.description,
      start_time: input.startTime,
      ...(input.endTime !== undefined ? { end_time: input.endTime } : {}),
    })
    .eq("id", entryId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTimeEntry(entryId: string) {
  const { error } = await supabase.from("time_entries").delete().eq("id", entryId)
  if (error) throw error
}
