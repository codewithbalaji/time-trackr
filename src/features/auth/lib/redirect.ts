// Where to send someone after they sign in or sign up.
//
// The invite flow needs this: /invite/accept?token=... is public, but a
// signed-out visitor has to authenticate first, and afterwards must land back
// on the invitation rather than the generic organization picker.
//
// The parameter is attacker-controllable (it's in a URL anyone can craft and
// send), so it is only ever honoured as a same-origin *path*. Anything that
// could point off-site — an absolute URL, a scheme-relative "//evil.com", a
// backslash some browsers normalise to a slash — falls back to the default.
const DEFAULT_REDIRECT = "/select-organization"

export function safeRedirectPath(value: string | null | undefined): string {
  if (!value) return DEFAULT_REDIRECT
  if (!value.startsWith("/")) return DEFAULT_REDIRECT
  if (value.startsWith("//") || value.startsWith("/\\")) return DEFAULT_REDIRECT
  return value
}
