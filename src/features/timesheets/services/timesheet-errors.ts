import type { PostgrestError } from "@supabase/supabase-js"

const TIMESHEET_ERROR_MESSAGES: Record<string, string> = {
  insufficient_permissions: "You don't have permission to do that.",
  timer_running: "Stop your running timer before submitting this week.",
  timesheet_not_submitted: "This timesheet isn't submitted.",
  not_draft: "This timesheet can't be submitted from its current state.",
  not_rejected: "This timesheet isn't awaiting resubmission.",
  "42501": "You don't have permission to do that.",
}

export function mapTimesheetError(error: Pick<PostgrestError, "message" | "code">): string {
  return (
    TIMESHEET_ERROR_MESSAGES[error.message] ??
    TIMESHEET_ERROR_MESSAGES[error.code] ??
    "Something went wrong. Please try again."
  )
}
