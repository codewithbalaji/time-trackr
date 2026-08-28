import { FunctionsHttpError } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase"

export type CreateInvitationInput = {
  organizationId: string
  email: string
  invitedBy: string
}

export async function createInvitation({
  organizationId,
  email,
  invitedBy,
}: CreateInvitationInput) {
  const { data, error } = await supabase
    .from("invitations")
    .insert({ organization_id: organizationId, email, invited_by: invitedBy })
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
  role: "owner" | "member"
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
