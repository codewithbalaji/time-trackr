// Sends the invitation email for a just-created invitations row.
//
// The link it mails is the app's own /invite/accept?token=<invitations.token>,
// NOT a GoTrue verification URL. GoTrue links are single-use, and corporate
// mail scanners pre-fetch links on delivery — which burned the token before the
// human clicked and surfaced as "this invitation link has already expired"
// minutes after it was sent. The invitations row's token is idempotent and
// valid for 7 days, so a scanner GET costs nothing.
//
// Because the link is ours, GoTrue can't mail it, so this function talks to
// Resend's API directly. That also means delivery failures are visible here
// (and in this function's logs) instead of vanishing inside GoTrue.
//
// Runs with the service-role key, which must never live in frontend code
// (see docs/security.md) — this function is the only place it's used.
import { createClient } from "jsr:@supabase/supabase-js@2"

import { renderInviteEmail } from "./invite-email.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const FROM_ADDRESS = "Time Trackr <noreply@mail.timetrackr.bkads.in>"

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

// The accept link is emailed, so its host must never come from a caller-supplied
// header — an attacker who can set Origin could otherwise have us mail a
// phishing URL carrying a real invitation token. APP_URL is the only source of
// truth; the request's origin is honoured solely when it already matches it
// (or is localhost, for `supabase functions serve` during development).
function resolveAppUrl(req: Request, appUrl: string | undefined) {
  const origin = req.headers.get("origin")
  if (!origin) return appUrl
  if (appUrl && origin === appUrl) return origin
  try {
    const { hostname } = new URL(origin)
    if (hostname === "localhost" || hostname === "127.0.0.1") return origin
  } catch {
    // Malformed Origin — fall through to APP_URL.
  }
  return appUrl
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const resendApiKey = Deno.env.get("RESEND_API_KEY")
  const appUrl = resolveAppUrl(req, Deno.env.get("APP_URL"))

  try {
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set — cannot send invitation email")
      return jsonResponse({ error: "Email delivery is not configured.", code: "email_not_configured" }, 500)
    }
    if (!appUrl) {
      console.error("APP_URL is not set — cannot build an invitation link")
      return jsonResponse({ error: "Email delivery is not configured.", code: "email_not_configured" }, 500)
    }

    const { invitationId } = await req.json()
    if (!invitationId) {
      return jsonResponse({ error: "invitationId is required" }, 400)
    }

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401)
    }

    // Scoped to the caller's own JWT: RLS ("Members with members.invite can
    // create invitations" and the owner-visibility select policy) is the
    // authorization check here, not application code.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: invitation, error: invitationError } = await callerClient
      .from("invitations")
      .select("id, email, organization_id, token, invited_by, role_id")
      .eq("id", invitationId)
      .single()

    if (invitationError || !invitation) {
      console.error("Invitation lookup failed", invitationId, invitationError?.message)
      return jsonResponse({ error: "Invitation not found" }, 404)
    }

    // Org/role/inviter names are only for the email body. They're read with the
    // service-role client because an invitee's inviter may be the only person
    // who can see them under RLS, and we've already authorized via the caller
    // client above.
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const [{ data: organization }, { data: role }, { data: inviter }] = await Promise.all([
      adminClient.from("organizations").select("name").eq("id", invitation.organization_id).single(),
      adminClient.from("roles").select("name").eq("id", invitation.role_id).single(),
      adminClient.from("profiles").select("full_name").eq("id", invitation.invited_by).single(),
    ])

    const acceptUrl = `${appUrl}/invite/accept?token=${invitation.token}`
    const html = renderInviteEmail({
      acceptUrl,
      organizationName: organization?.name ?? "your team",
      roleName: role?.name ?? "a member",
      invitedByName: inviter?.full_name ?? null,
    })

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [invitation.email],
        subject: `You've been invited to ${organization?.name ?? "Time Trackr"}`,
        html,
      }),
    })

    if (!response.ok) {
      // Resend's error body is JSON, but don't assume it — a gateway error may
      // return HTML. Either way, log it: this is the failure mode that used to
      // be completely invisible.
      const detail = await response.text().catch(() => "")
      console.error("Resend rejected the invitation email", response.status, detail)
      return jsonResponse(
        { error: "The invitation email could not be sent. Please try again.", code: "email_send_failed" },
        502
      )
    }

    // The invitations row is deliberately left in place on failure. An earlier
    // version deleted it so the "one pending invite per email" constraint
    // wouldn't block a retry, but that destroyed the row and its audit trail on
    // a transient SMTP hiccup. The recovery path is the Resend/Revoke buttons
    // on the Members page, which act on the row that's still there.
    return jsonResponse({ ok: true }, 200)
  } catch (error) {
    console.error("send-invite-email failed", error)
    return jsonResponse({ error: error instanceof Error ? error.message : "Unexpected error" }, 500)
  }
})
