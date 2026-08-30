import { supabase } from "@/lib/supabase"
import type { DateFormat, TimeFormat } from "@/features/organizations/lib/date-time-format"

export async function createOrganizationWithOwner(name: string) {
  const { data, error } = await supabase.rpc("create_organization_with_owner", {
    p_name: name,
  })
  if (error) throw error
  return data
}

export type MembershipWithOrganization = {
  id: string
  role: { id: string; name: string }
  status: "active" | "suspended"
  organization: {
    id: string
    name: string
    timezone: string
    date_format: DateFormat
    time_format: TimeFormat
    day_start: string
  }
}

const ORGANIZATION_COLUMNS = "id, name, timezone, date_format, time_format, day_start"

// A user can belong to more than one organization (see
// docs/decisions/0003-multi-organization-selection.md) — an empty array means
// they haven't onboarded/joined anything yet.
export async function getMembershipsForUser(
  userId: string
): Promise<MembershipWithOrganization[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select(`id, role:roles(id, name), status, organization:organizations(${ORGANIZATION_COLUMNS})`)
    .eq("user_id", userId)
  if (error) throw error
  return data as unknown as MembershipWithOrganization[]
}

export async function updateOrganizationTimeSettings(
  organizationId: string,
  input: { timezone: string; dateFormat: DateFormat; timeFormat: TimeFormat; dayStart: string }
) {
  const { data, error } = await supabase
    .from("organizations")
    .update({
      timezone: input.timezone,
      date_format: input.dateFormat,
      time_format: input.timeFormat,
      day_start: input.dayStart,
    })
    .eq("id", organizationId)
    .select()
    .single()
  if (error) throw error
  return data
}
