import type { PostgrestError } from "@supabase/supabase-js"

const PROJECT_ERROR_MESSAGES: Record<string, string> = {
  "23505": "A project with this name already exists.",
  "42501": "You don't have permission to do that.",
}

export function mapProjectError(error: Pick<PostgrestError, "message" | "code">): string {
  return (
    PROJECT_ERROR_MESSAGES[error.code] ??
    PROJECT_ERROR_MESSAGES[error.message] ??
    "Something went wrong. Please try again."
  )
}
