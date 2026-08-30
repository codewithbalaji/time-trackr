import { supabase } from "@/lib/supabase"

export type ProjectMember = {
  id: string
  created_at: string
  profile: { id: string; full_name: string | null; email: string }
}

export async function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select("id, created_at, profile:profiles(id, full_name, email)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
  if (error) throw error
  return data as unknown as ProjectMember[]
}

export async function addProjectMember(projectId: string, userId: string) {
  const { data, error } = await supabase
    .from("project_members")
    .insert({ project_id: projectId, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeProjectMember(projectMemberId: string) {
  const { error } = await supabase.from("project_members").delete().eq("id", projectMemberId)
  if (error) throw error
}
