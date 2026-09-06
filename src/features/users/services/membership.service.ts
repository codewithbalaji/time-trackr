import { supabase } from "@/lib/supabase"

export type OrgMember = {
  id: string
  role: { id: string; name: string }
  status: "active" | "suspended"
  created_at: string
  profile: { id: string; full_name: string | null; email: string }
}

export async function listOrgMembers(organizationId: string): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select("id, role:roles(id, name), status, created_at, profile:profiles(id, full_name, email)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true })
  if (error) throw error
  return data as unknown as OrgMember[]
}

export async function updateMembershipStatus(
  membershipId: string,
  status: "active" | "suspended"
) {
  const { data, error } = await supabase
    .from("memberships")
    .update({ status })
    .eq("id", membershipId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeMember(membershipId: string) {
  // `.select()` is load-bearing, not decoration. A DELETE that RLS refuses
  // matches zero rows and returns no error, so without reading the result back
  // every refusal from can_manage_target_membership — removing yourself, the
  // last active Owner, or an Owner when you aren't one — looked like a success:
  // the cache was invalidated and the member simply reappeared.
  const { data, error } = await supabase
    .from("memberships")
    .delete()
    .eq("id", membershipId)
    .select("id")
  if (error) throw error
  if (!data || data.length === 0) throw { code: "not_permitted", message: "not_permitted" }
}
