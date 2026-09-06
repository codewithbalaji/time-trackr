const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Incorrect email or password.",
  email_not_confirmed: "Please verify your email before signing in.",
  user_already_exists: "An account with this email already exists.",
  email_exists: "An account with this email already exists.",
  email_address_invalid: "That email address isn't valid.",
  weak_password: "Password does not meet the minimum requirements.",
  over_email_send_rate_limit:
    "Too many requests. Please wait before trying again.",
  over_request_rate_limit:
    "Too many attempts. Please wait a few minutes and try again.",
  same_password: "New password must be different from your current password.",
  user_banned: "This account has been suspended. Contact your administrator.",
  signup_disabled: "New accounts aren't being accepted right now.",
  otp_expired: "That link has expired. Request a new one.",
  session_not_found: "Your session has expired. Sign in again.",
  session_expired: "Your session has expired. Sign in again.",
}

// The parameter is typed `unknown` on purpose. TanStack Query types a
// mutation's error as `Error`, and the call can reject with a bare
// `TypeError: Failed to fetch` when the browser is offline or the request is
// blocked — annotating it as AuthError at the call site didn't make it one.
export function isOffline(error: unknown): boolean {
  // fetch() rejects with a TypeError for network-level failures (offline, DNS,
  // CORS). GoTrue errors are AuthError instances and carry a `code`, so a
  // TypeError without one is the network case rather than a server response.
  return error instanceof TypeError && !("code" in error)
}

// Never pass a raw AuthError to a logger/toast beyond code+message — it can
// carry request context that shouldn't be surfaced or persisted verbatim.
export function mapAuthError(error: unknown): string {
  if (isOffline(error)) {
    return "Couldn't reach the server. Check your connection and try again."
  }

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : ""

  return AUTH_ERROR_MESSAGES[code] ?? "Something went wrong. Please try again."
}
