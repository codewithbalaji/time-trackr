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

// Idempotent: safe to call multiple times (e.g. from both main.tsx and tests).
export function initAuthStore() {
  if (initialized) return
  initialized = true

  supabase.auth.getSession().then(({ data }) => {
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
}
