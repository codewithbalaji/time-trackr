import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const {
  signUp,
  signInWithPassword,
  signOut,
  resetPasswordForEmail,
  updatePassword,
} = await import("@/features/auth/services/auth.service")

beforeEach(() => {
  vi.clearAllMocks()
})

describe("auth.service", () => {
  it("signUp passes full_name metadata and an emailRedirectTo callback URL", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ data: { user: null, session: null }, error: null })

    await signUp({ email: "a@b.com", password: "Password1", fullName: "Jane" })

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "Password1",
      options: {
        data: { full_name: "Jane" },
        emailRedirectTo: expect.stringContaining("/auth/callback"),
      },
    })
  })

  it("signUp throws the Supabase error", async () => {
    const error = { code: "email_exists", message: "exists" }
    mockSupabase.auth.signUp.mockResolvedValue({ data: null, error })

    await expect(
      signUp({ email: "a@b.com", password: "Password1", fullName: "Jane" })
    ).rejects.toEqual(error)
  })

  it("signInWithPassword forwards credentials and throws on error", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    })

    await signInWithPassword({ email: "a@b.com", password: "Password1" })

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "Password1",
    })
  })

  it("signOut throws on error", async () => {
    mockSupabase.auth.signOut.mockResolvedValue({
      error: { code: "x", message: "fail" },
    })

    await expect(signOut()).rejects.toEqual({ code: "x", message: "fail" })
  })

  it("resetPasswordForEmail passes a recovery redirect URL", async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

    await resetPasswordForEmail("a@b.com")

    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "a@b.com",
      { redirectTo: expect.stringContaining("type=recovery") }
    )
  })

  it("updatePassword calls updateUser with the new password", async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({ error: null })

    await updatePassword("NewPassword1")

    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      password: "NewPassword1",
    })
  })
})
