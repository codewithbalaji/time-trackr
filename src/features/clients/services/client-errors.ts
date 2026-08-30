import type { PostgrestError } from "@supabase/supabase-js"

// Keys match either a raw Postgres error code (e.g. a unique constraint
// violation) or the RLS permission-denied code, same shape as
// organization-errors.ts.
const CLIENT_ERROR_MESSAGES: Record<string, string> = {
  "23505": "A client with this name already exists.",
  "42501": "You don't have permission to do that.",
}

export function mapClientError(error: Pick<PostgrestError, "message" | "code">): string {
  return (
    CLIENT_ERROR_MESSAGES[error.code] ??
    CLIENT_ERROR_MESSAGES[error.message] ??
    "Something went wrong. Please try again."
  )
}
