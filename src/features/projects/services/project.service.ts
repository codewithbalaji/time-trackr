import { supabase } from "@/lib/supabase"

export type Project = {
  id: string
  name: string
  color: string
  description: string | null
  status: "active" | "archived"
  created_at: string
  client: { id: string; name: string } | null
}

export async function listProjects(organizationId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, color, description, status, created_at, client:clients(id, name)")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true })
  if (error) throw error
  return data as unknown as Project[]
}

export async function createProject(input: {
  organizationId: string
  name: string
  clientId: string | null
  color: string
  description: string | undefined
  createdBy: string
}) {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      organization_id: input.organizationId,
      name: input.name,
      client_id: input.clientId,
      color: input.color,
      description: input.description || null,
      created_by: input.createdBy,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProject(
  projectId: string,
  input: {
    name: string
    clientId: string | null
    color: string
    description?: string
  }
) {
  const { data, error } = await supabase
    .from("projects")
    .update({
      name: input.name,
      client_id: input.clientId,
      color: input.color,
      description: input.description || null,
    })
    .eq("id", projectId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function setProjectStatus(projectId: string, status: "active" | "archived") {
  const { data, error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId)
    .select()
    .single()
  if (error) throw error
  return data
}
