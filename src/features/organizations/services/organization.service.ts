import { supabase } from "@/lib/supabase"
import type { DateFormat, TimeFormat } from "@/features/organizations/lib/date-time-format"
import { detectBrowserTimezone } from "@/features/organizations/lib/timezone-options"

export async function createOrganizationWithOwner(name: string) {
  const { data, error } = await supabase.rpc("create_organization_with_owner", {
    p_name: name,
    // Organizations used to be created at the column default of 'UTC', and the
    // Settings screen hid that by displaying the browser's zone instead — a
    // value it could not actually save. Seeding the real one at creation is the
    // fix; it stays editable from Settings afterwards. detectBrowserTimezone
    // normalises legacy aliases ("Asia/Calcutta" to "Asia/Kolkata") and returns
    // undefined when it can't, in which case the RPC keeps its 'UTC' default.
    p_timezone: detectBrowserTimezone() ?? "UTC",
  })
  if (error) throw error
  return data
}

export async function updateOrganizationName(organizationId: string, name: string) {
  const { data, error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", organizationId)
    .select()
    .single()
  if (error) throw error
  return data
}

export type MembershipWithOrganization = {
  id: string
  role: { id: string; name: string }
  status: "active" | "suspended"
  created_at: string
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
    .select(
      `id, role:roles(id, name), status, created_at, organization:organizations(${ORGANIZATION_COLUMNS})`
    )
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
