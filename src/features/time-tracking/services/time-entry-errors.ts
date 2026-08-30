import type { PostgrestError } from "@supabase/supabase-js"

const TIME_ENTRY_ERROR_MESSAGES: Record<string, string> = {
  "23505": "You already have a timer running. Stop it before starting another.",
  "23514": "End time must be after start time.",
  "42501": "You don't have permission to do that.",
  "project does not belong to the entry's organization": "Select a project from your organization.",
}

export function mapTimeEntryError(error: Pick<PostgrestError, "message" | "code">): string {
  return (
    TIME_ENTRY_ERROR_MESSAGES[error.code] ??
    TIME_ENTRY_ERROR_MESSAGES[error.message] ??
    "Something went wrong. Please try again."
  )
}
