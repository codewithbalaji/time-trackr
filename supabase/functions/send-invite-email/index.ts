// Sends the Supabase-managed invite email for a just-created invitations row.
// Runs with the service-role key, which must never live in frontend code
// (see docs/security.md) — this function is the only place it's used.
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  let invitationId: string | undefined
  let isResend = false

  try {
    ;({ invitationId, isResend = false } = await req.json())
    if (!invitationId) {
      return jsonResponse({ error: "invitationId is required" }, 400)
    }

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401)
    }

    // Scoped to the caller's own JWT: RLS ("Owners can view their organization's
    // invitations") is the authorization check here, not application code.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: invitation, error: invitationError } = await callerClient
      .from("invitations")
      .select("id, email, organization_id, token")
      .eq("id", invitationId)
      .single()

    if (invitationError || !invitation) {
      return jsonResponse({ error: "Invitation not found" }, 404)
    }

    const origin = req.headers.get("origin") ?? supabaseUrl

    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      invitation.email,
      {
        redirectTo: `${origin}/auth/callback`,
        data: { invitation_token: invitation.token },
      }
    )

    if (inviteError) {
      // The invitee already has an auth account (in this org or another one)
      // — GoTrue refuses to create a second one for the same email, but that
      // isn't a real failure here: the invitations row stays pending and
      // they accept/decline it in-app from /select-organization instead of
      // via this email (see accept_invitation/decline_invitation RLS in
      // supabase/migrations/20260914090000_existing_user_invite_flow.sql).
      if (inviteError.code === "email_exists" || inviteError.code === "user_already_exists") {
        return jsonResponse({ ok: true, existingAccount: true }, 200)
      }

      // Roll back the row created by createInvitation() so the caller isn't
      // permanently blocked by the "one pending invite per email" constraint
      // after a delivery failure. Uses the service-role client since the
      // client-facing RLS on invitations deliberately has no delete policy.
      // Only for a first-time create, though — a resend's row is an existing
      // pending invitation, and a transient send failure shouldn't destroy it.
      if (!isResend) {
        await adminClient.from("invitations").delete().eq("id", invitationId)
      }
      return jsonResponse({ error: inviteError.message, code: inviteError.code }, 400)
    }

    return jsonResponse({ ok: true }, 200)
  } catch (error) {
    if (invitationId && !isResend) {
      await adminClient.from("invitations").delete().eq("id", invitationId)
    }
    return jsonResponse({ error: error instanceof Error ? error.message : "Unexpected error" }, 500)
  }
})
