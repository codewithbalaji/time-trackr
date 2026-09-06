import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

// initAuthStore memoises after the first call, so each test re-imports the
// module to get a fresh one.
async function freshStore() {
  return await import("@/features/auth/stores/authStore")
}

describe("initAuthStore", () => {
  it("records the session it finds", async () => {
    const session = { access_token: "t", user: { id: "u-1" } }
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session }, error: null })

    const { initAuthStore, useAuthStore } = await freshStore()
    await initAuthStore()

    expect(useAuthStore.getState().status).toBe("authenticated")
    expect(useAuthStore.getState().session).toBe(session)
  })

  it("degrades to signed out when getSession rejects", async () => {
    // main.tsx awaits this before rendering anything, so an unhandled rejection
    // here is a blank page with the Sentry boundary never mounted to report it.
    mockSupabase.auth.getSession.mockRejectedValue(new Error("storage unavailable"))

    const { initAuthStore, useAuthStore } = await freshStore()
    await expect(initAuthStore()).resolves.toBeUndefined()

    expect(useAuthStore.getState().status).toBe("unauthenticated")
    expect(useAuthStore.getState().session).toBeNull()
  })

  it("is idempotent", async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })

    const { initAuthStore } = await freshStore()
    await Promise.all([initAuthStore(), initAuthStore()])

    expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(1)
  })
})

describe("password recovery tracking", () => {
  it("flags a session that arrived via a recovery link", async () => {
    // The `type=recovery` URL param doesn't survive the PKCE redirect, so this
    // event is the reliable signal that /auth/callback keys off.
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    let emit: ((event: string, session: unknown) => void) | undefined
    mockSupabase.auth.onAuthStateChange.mockImplementation((cb: typeof emit) => {
      emit = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    const { initAuthStore, useAuthStore, clearPasswordRecovery } = await freshStore()
    await initAuthStore()

    expect(useAuthStore.getState().isPasswordRecovery).toBe(false)

    emit!("PASSWORD_RECOVERY", { access_token: "t", user: { id: "u-1" } })
    expect(useAuthStore.getState().isPasswordRecovery).toBe(true)

    clearPasswordRecovery()
    expect(useAuthStore.getState().isPasswordRecovery).toBe(false)
  })

  it("clears the flag on sign out", async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    let emit: ((event: string, session: unknown) => void) | undefined
    mockSupabase.auth.onAuthStateChange.mockImplementation((cb: typeof emit) => {
      emit = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    const { initAuthStore, useAuthStore } = await freshStore()
    await initAuthStore()

    emit!("PASSWORD_RECOVERY", { access_token: "t" })
    emit!("SIGNED_OUT", null)

    expect(useAuthStore.getState().isPasswordRecovery).toBe(false)
    expect(useAuthStore.getState().status).toBe("unauthenticated")
  })
})
