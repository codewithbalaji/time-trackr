import { redirect } from "react-router"

import { useAuthStore } from "@/features/auth/stores/authStore"

// Called from the router's loaders — loaders run outside the component tree,
// so guards read the Zustand store's snapshot directly rather than via a hook.
export function requireSession() {
  const { session } = useAuthStore.getState()
  if (!session) {
    throw redirect("/login")
  }
  return null
}

// Used by /login and /signup loaders so an already-authenticated user can't
// navigate back to the auth forms.
export function redirectIfAuthenticated() {
  const { session } = useAuthStore.getState()
  if (session) {
    throw redirect("/")
  }
  return null
}
