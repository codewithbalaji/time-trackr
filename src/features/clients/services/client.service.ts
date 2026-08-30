import { supabase } from "@/lib/supabase"

export type Client = {
  id: string
  name: string
  status: "active" | "archived"
  created_at: string
}

export async function listClients(organizationId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, status, created_at")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true })
  if (error) throw error
  return data
}

export async function createClient(input: {
  organizationId: string
  name: string
  createdBy: string
}) {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      organization_id: input.organizationId,
      name: input.name,
      created_by: input.createdBy,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateClientName(clientId: string, name: string) {
  const { data, error } = await supabase
    .from("clients")
    .update({ name })
    .eq("id", clientId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function setClientStatus(clientId: string, status: "active" | "archived") {
  const { data, error } = await supabase
    .from("clients")
    .update({ status })
    .eq("id", clientId)
    .select()
    .single()
  if (error) throw error
  return data
}
