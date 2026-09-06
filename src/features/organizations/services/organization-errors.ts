import type { PostgrestError } from "@supabase/supabase-js"

// Keys match one of: a RAISE EXCEPTION message from the Postgres RPCs
// (supabase/migrations/20260827135646_create_organizations.sql), a raw
// Postgres error code (e.g. a unique constraint violation), or a GoTrue
// AuthError code surfaced through the send-invite-email Edge Function's
// error body (see invitation.service.ts's toInvitationError).
const ORGANIZATION_ERROR_MESSAGES: Record<string, string> = {
  invitation_not_found: "This invitation link is invalid.",
  invitation_expired: "This invitation has expired. Ask the organization owner to send a new one.",
  invitation_email_mismatch: "This invitation was sent to a different email address.",
  "23505": "There's already a pending invitation for this email.",
  email_exists: "That person already has an account.",
  user_already_exists: "That person already has an account.",
  over_email_send_rate_limit: "Too many invitations sent. Please wait before trying again.",
  email_send_failed: "The invitation email couldn't be sent. The invitation is saved — try Resend from the members list.",
  email_not_configured: "Email delivery isn't configured yet. The invitation is saved — ask an administrator to check the email settings.",
  email_unreachable: "We couldn't reach the server to send the invitation. Check your connection and try Resend from the members list.",
  not_permitted: "You don't have permission to do that.",
  membership_not_found: "That member no longer exists.",
  insufficient_permissions: "You don't have permission to do that.",
  role_not_found: "That role doesn't exist in this organization.",
  membership_identity_change_forbidden: "That change isn't allowed.",
  cannot_change_own_role: "You can't change your own role.",
  only_owner_can_manage_owner_role: "Only an owner can grant or remove the Owner role.",
  cannot_remove_last_owner: "This organization needs at least one owner — promote someone else first.",
  already_a_member: "You're already a member of this organization. If your account was suspended, ask an admin to reactivate you from the Members page.",
  invalid_timezone: "That's not a recognized timezone.",
  "23514": "That value isn't valid.",
  // PostgREST returns this when .single() matched no row — under RLS that
  // usually means the write was refused rather than that the row is missing.
  PGRST116: "You don't have permission to do that, or that item no longer exists.",
}

export function mapOrganizationError(error: Pick<PostgrestError, "message" | "code">): string {
  return (
    ORGANIZATION_ERROR_MESSAGES[error.message] ??
    ORGANIZATION_ERROR_MESSAGES[error.code] ??
    "Something went wrong. Please try again."
  )
}
