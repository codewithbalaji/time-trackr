import { create } from "zustand"
import type { Session } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

type AuthState = {
  session: Session | null
  status: AuthStatus
}

// Narrow, cross-component client state only (session identity) — kept
// deliberately thin so React Router v8 data-router loaders, which run
// outside the component tree, can synchronously read `getState()` before
// any provider mounts. Profile data belongs in TanStack Query, not here.
export const useAuthStore = create<AuthState>(() => ({
  session: null,
  status: "loading",
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

  ready = supabase.auth.getSession().then(({ data }) => {
    useAuthStore.setState({
      session: data.session,
      status: data.session ? "authenticated" : "unauthenticated",
    })
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.setState({
      session,
      status: session ? "authenticated" : "unauthenticated",
    })
  })

  return ready
}
