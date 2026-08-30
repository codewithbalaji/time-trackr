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
}

export function mapOrganizationError(error: Pick<PostgrestError, "message" | "code">): string {
  return (
    ORGANIZATION_ERROR_MESSAGES[error.message] ??
    ORGANIZATION_ERROR_MESSAGES[error.code] ??
    "Something went wrong. Please try again."
  )
}
