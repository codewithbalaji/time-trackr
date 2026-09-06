import { supabase } from "@/lib/supabase"
import type { Theme } from "@/hooks/theme-context"

export type Profile = {
  id: string
  full_name: string | null
  email: string
  theme: Theme
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, theme")
    .eq("id", userId)
    .maybeSingle()
  if (error) throw error
  return data as Profile | null
}

// Partial by design: the name form and the theme toggle write different single
// fields, and neither should clobber the other's.
export async function updateProfile(
  userId: string,
  changes: { full_name?: string; theme?: Theme }
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(changes)
    .eq("id", userId)
    .select("id, full_name, email, theme")
    .single()
  if (error) throw error
  return data as Profile
}
