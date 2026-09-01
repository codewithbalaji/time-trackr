import type { PostgrestError } from "@supabase/supabase-js"

const APPROVAL_ERROR_MESSAGES: Record<string, string> = {
  insufficient_permissions: "You don't have permission to do that.",
  not_pending_approval: "This timesheet is no longer awaiting review.",
  rejection_reason_required: "Enter a reason for rejecting this timesheet.",
  "42501": "You don't have permission to do that.",
}

export function mapApprovalError(error: Pick<PostgrestError, "message" | "code">): string {
  return (
    APPROVAL_ERROR_MESSAGES[error.message] ??
    APPROVAL_ERROR_MESSAGES[error.code] ??
    "Something went wrong. Please try again."
  )
}
