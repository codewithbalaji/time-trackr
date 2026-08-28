import { supabase } from "@/lib/supabase"

export async function createOrganizationWithOwner(name: string) {
  const { data, error } = await supabase.rpc("create_organization_with_owner", {
    p_name: name,
  })
  if (error) throw error
  return data
}

export type MembershipWithOrganization = {
  id: string
  role: "owner" | "member"
  organization: { id: string; name: string }
}

// A user can belong to more than one organization (see
// docs/decisions/0003-multi-organization-selection.md) — an empty array means
// they haven't onboarded/joined anything yet.
export async function getMembershipsForUser(
  userId: string
): Promise<MembershipWithOrganization[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select("id, role, organization:organizations(id, name)")
    .eq("user_id", userId)
  if (error) throw error
  return data as MembershipWithOrganization[]
}
