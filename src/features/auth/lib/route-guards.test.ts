import { beforeEach, describe, expect, it } from "vitest"

import { useAuthStore } from "@/features/auth/stores/authStore"
import { requireSession, redirectIfAuthenticated } from "@/features/auth/lib/route-guards"

function isRedirectTo(error: unknown, path: string) {
  return (
    error instanceof Response &&
    error.status === 302 &&
    error.headers.get("Location") === path
  )
}

beforeEach(() => {
  useAuthStore.setState({ session: null, status: "unauthenticated" })
})

describe("requireSession", () => {
  it("redirects to /login when there is no session", () => {
    try {
      requireSession()
      expect.fail("expected requireSession to throw a redirect")
    } catch (error) {
      expect(isRedirectTo(error, "/login")).toBe(true)
    }
  })

  it("does not throw when a session exists", () => {
    useAuthStore.setState({
      session: { user: { id: "1" } } as never,
      status: "authenticated",
    })
    expect(() => requireSession()).not.toThrow()
  })
})

describe("redirectIfAuthenticated", () => {
  it("redirects to / when a session exists", () => {
    useAuthStore.setState({
      session: { user: { id: "1" } } as never,
      status: "authenticated",
    })
    try {
      redirectIfAuthenticated()
      expect.fail("expected redirectIfAuthenticated to throw a redirect")
    } catch (error) {
      expect(isRedirectTo(error, "/")).toBe(true)
    }
  })

  it("does not throw when there is no session", () => {
    expect(() => redirectIfAuthenticated()).not.toThrow()
  })
})
