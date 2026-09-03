import { FunctionsHttpError } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase"

export type CreateInvitationInput = {
  organizationId: string
  email: string
  roleId: string
  invitedBy: string
}

export async function createInvitation({
  organizationId,
  email,
  roleId,
  invitedBy,
}: CreateInvitationInput) {
  const { data, error } = await supabase
    .from("invitations")
    .insert({ organization_id: organizationId, email, role_id: roleId, invited_by: invitedBy })
    .select()
    .single()
  if (error) throw error

  const { error: sendError } = await supabase.functions.invoke("send-invite-email", {
    body: { invitationId: data.id },
  })
  if (sendError) throw await toInvitationError(sendError)

  return data
}

// supabase.functions.invoke()'s error doesn't put the function's JSON error
// body in `.message` — it's on `FunctionsHttpError.context` (the raw
// Response), so we have to read it out ourselves to get the actual reason
// (e.g. the invitee already has an account) instead of a generic failure.
async function toInvitationError(error: unknown) {
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null)
    return { code: body?.code ?? "", message: body?.error ?? error.message }
  }
  return error
}

export type InvitationPreview = {
  email: string
  role_name: string
  status: "pending" | "accepted" | "revoked"
  expires_at: string
  organization_name: string
}

export async function getInvitationByToken(
  token: string
): Promise<InvitationPreview | null> {
  const { data, error } = await supabase.rpc("get_invitation_by_token", {
    p_token: token,
  })
  if (error) throw error
  return (data?.[0] as InvitationPreview | undefined) ?? null
}

export async function acceptInvitation(token: string) {
  const { data, error } = await supabase.rpc("accept_invitation", {
    p_token: token,
  })
  if (error) throw error
  return data
}

export type PendingInvitation = {
  id: string
  email: string
  role: { id: string; name: string }
  status: "pending" | "accepted" | "revoked"
  expires_at: string
  created_at: string
}

export async function listPendingInvitations(
  organizationId: string
): Promise<PendingInvitation[]> {
  const { data, error } = await supabase
    .from("invitations")
    .select("id, email, role:roles(id, name), status, expires_at, created_at")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
  if (error) throw error
  return data as unknown as PendingInvitation[]
}

export async function revokeInvitation(id: string) {
  const { error } = await supabase.from("invitations").update({ status: "revoked" }).eq("id", id)
  if (error) throw error
}

export type PendingInvitationForUser = {
  id: string
  token: string
  role_name: string
  organization_name: string
  expires_at: string
}

// Invitations addressed to the signed-in user's own email, regardless of
// which organization they're for — visible via the "Invitees can view
// pending invitations sent to their email" RLS policy, not an org-owner
// check. Surfaced on /select-organization for someone who already has an
// account (so was never sent the account-creation email — see
// send-invite-email's email_exists handling).
export async function listPendingInvitationsForCurrentUser(): Promise<
  PendingInvitationForUser[]
> {
  const { data, error } = await supabase
    .from("invitations")
    .select("id, token, expires_at, role:roles(name), organization:organizations(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data as unknown as Array<{
    id: string
    token: string
    expires_at: string
    role: { name: string }
    organization: { name: string }
  }>).map((row) => ({
    id: row.id,
    token: row.token,
    expires_at: row.expires_at,
    role_name: row.role.name,
    organization_name: row.organization.name,
  }))
}

export async function declineInvitation(token: string) {
  const { error } = await supabase.rpc("decline_invitation", { p_token: token })
  if (error) throw error
}

// Resend just extends the expiry window and re-sends the same email; the
// invitation row (and its token) stays the same rather than issuing a new one.
export async function resendInvitation(id: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from("invitations")
    .update({ expires_at: expiresAt })
    .eq("id", id)
    .select()
    .single()
  if (error) throw error

  const { error: sendError } = await supabase.functions.invoke("send-invite-email", {
    body: { invitationId: data.id, isResend: true },
  })
  if (sendError) throw await toInvitationError(sendError)

  return data
}
