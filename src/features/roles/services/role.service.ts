import { supabase } from "@/lib/supabase"

export type Role = {
  id: string
  name: string
  is_system: boolean
}

export async function listRoles(organizationId: string): Promise<Role[]> {
  const { data, error } = await supabase
    .from("roles")
    .select("id, name, is_system")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true })
  if (error) throw error
  return data
}

export async function hasPermission(
  organizationId: string,
  permissionKey: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_permission", {
    p_organization_id: organizationId,
    p_permission_key: permissionKey,
  })
  if (error) throw error
  return data ?? false
}

// One round trip for every permission key the caller holds in this org,
// instead of a separate has_permission() RPC per key — several components on
// the Members page each check a different permission, and without this they'd
// each cause their own network round trip. Plain nested select (not an RPC):
// RLS on roles/role_permissions/permissions already scopes this correctly for
// an org member reading their own membership row.
export async function listMyPermissions(
  organizationId: string,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select("role:roles(role_permissions(permission:permissions(key)))")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .single()
  if (error) throw error

  const role = data.role as unknown as {
    role_permissions: { permission: { key: string } }[]
  }
  return role.role_permissions.map((rp) => rp.permission.key)
}

export async function assignMembershipRole(membershipId: string, roleId: string) {
  const { data, error } = await supabase.rpc("assign_membership_role", {
    p_membership_id: membershipId,
    p_role_id: roleId,
  })
  if (error) throw error
  return data
}
