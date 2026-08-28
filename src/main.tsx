import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initAuthStore } from './features/auth/stores/authStore'

// GoTrue redirects an expired/invalid auth link's #error=... hash to
// `site_url` (the app root) whenever the requested redirect_to isn't
// allow-listed exactly, bypassing /auth/callback entirely — leaving the user
// on whatever unauthenticated page "/" resolves to with no explanation. Catch
// that here, before routing even starts, and send it to the one place that
// already knows how to explain it.
function redirectStrayAuthErrorToCallback() {
  const hash = window.location.hash
  if (!hash || window.location.pathname === '/auth/callback') return false
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  if (params.has('error') || params.has('error_code') || params.has('error_description')) {
    window.location.replace(`/auth/callback${hash}`)
    return true
  }
  return false
}

async function main() {
  // Bail out before rendering anything — a navigation is already in flight.
  if (redirectStrayAuthErrorToCallback()) return
  // Resolve the initial session before ./app/App (and, transitively,
  // ./app/router, whose createBrowserRouter starts loading data as soon as
  // it's constructed) is even imported — see the comment on initAuthStore.
  await initAuthStore()
  const { App } = await import('./app/App.tsx')

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

main()
