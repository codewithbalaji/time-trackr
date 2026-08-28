import { supabase } from "@/lib/supabase"

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateProfile(userId: string, fullName: string) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId)
    .select()
    .single()
  if (error) throw error
  return data
}
