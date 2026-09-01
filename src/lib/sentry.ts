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
    // Traces/session replay cost quota and aren't needed to get useful error
    // reports flowing — revisit only if error volume alone isn't enough.
    integrations: [],
  })
}
