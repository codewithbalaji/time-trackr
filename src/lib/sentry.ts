import * as Sentry from '@sentry/react'

// Opt-in: no DSN means no-op, so local development and any deploy that
// hasn't set up a Sentry project yet behave identically to today. See
// docs/deployment.md for how to create a project and get a DSN.
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.replayIntegration(),
      // No console.log/warn/error calls exist in src/ today (errors surface
      // via toast.error(), per docs/security.md) — safe to forward all three
      // levels without risking a pre-existing debug log leaking anything.
      // Re-check this if that ever changes.
      Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
    ],
    // Session Replay: a low background sample rate (cost/quota reasons), but
    // always capture the replay when a session actually errors — that's the
    // case debugging benefits from most. Replay's default privacy settings
    // (mask all text, block all media) stay on; this app never overrides
    // them, per docs/security.md's "don't assume the frontend is trusted"
    // stance applied to what we send to a third party too.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}
