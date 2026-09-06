import { create } from "zustand"
import type { Session } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

type AuthState = {
  session: Session | null
  status: AuthStatus
  // Set when GoTrue reports PASSWORD_RECOVERY, i.e. the session in hand came
  // from a password-reset link. AuthCallbackPage can't tell that from the URL:
  // the PKCE flow redirects with only `?code=`, dropping the `type` param the
  // page used to key off. The event is the reliable signal.
  isPasswordRecovery: boolean
}

// Narrow, cross-component client state only (session identity) — kept
// deliberately thin so React Router v8 data-router loaders, which run
// outside the component tree, can synchronously read `getState()` before
// any provider mounts. Profile data belongs in TanStack Query, not here.
export const useAuthStore = create<AuthState>(() => ({
  session: null,
  status: "loading",
  isPasswordRecovery: false,
}))

let initialized = false
let ready: Promise<void> | undefined

// Idempotent: safe to call multiple times (e.g. from both main.tsx and tests).
// Returns a promise that resolves once the initial session lookup has landed
// in the store — main.tsx awaits this before creating the router, since
// createBrowserRouter starts running the initial route's loader as soon as
// it's constructed, regardless of when <RouterProvider> mounts. Without
// awaiting this first, the very first loader run would see the store's
// default `session: null` and redirect to /login even with a valid session.
export function initAuthStore() {
  if (initialized) return ready!
  initialized = true

  ready = supabase.auth
    .getSession()
    .then(({ data }) => {
      useAuthStore.setState({
        session: data.session,
        status: data.session ? "authenticated" : "unauthenticated",
      })
    })
    // getSession can reject outright — corrupt localStorage, storage disabled
    // by browser settings, a refresh that fails at the network. main.tsx awaits
    // this before rendering anything, so an unhandled rejection here means a
    // blank page with the Sentry boundary never mounted to report it. Falling
    // back to "signed out" at least lands them on the login screen.
    .catch(() => {
      useAuthStore.setState({ session: null, status: "unauthenticated" })
    })

  supabase.auth.onAuthStateChange((event, session) => {
    useAuthStore.setState({
      session,
      status: session ? "authenticated" : "unauthenticated",
      ...(event === "PASSWORD_RECOVERY" ? { isPasswordRecovery: true } : {}),
      ...(event === "SIGNED_OUT" ? { isPasswordRecovery: false } : {}),
    })
  })

  return ready
}

// Cleared once the reset form has been used, so a later visit to
// /reset-password in the same session isn't still treated as a recovery.
export function clearPasswordRecovery() {
  useAuthStore.setState({ isPasswordRecovery: false })
}
