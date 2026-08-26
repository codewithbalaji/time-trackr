import type { AuthError } from "@supabase/supabase-js"

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Incorrect email or password.",
  email_not_confirmed: "Please verify your email before signing in.",
  user_already_exists: "An account with this email already exists.",
  email_exists: "An account with this email already exists.",
  weak_password: "Password does not meet the minimum requirements.",
  over_email_send_rate_limit:
    "Too many requests. Please wait before trying again.",
  same_password: "New password must be different from your current password.",
}

// Never pass a raw AuthError to a logger/toast beyond code+message — it can
// carry request context that shouldn't be surfaced or persisted verbatim.
export function mapAuthError(error: AuthError): string {
  return (
    AUTH_ERROR_MESSAGES[error.code ?? ""] ??
    "Something went wrong. Please try again."
  )
}
