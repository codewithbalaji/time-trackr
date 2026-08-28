import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { getProfile, updateProfile } = await import("@/features/auth/services/profile.service")

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getProfile", () => {
  it("fetches the profile row for a user", async () => {
    const profile = { id: "user-1", email: "a@b.com", full_name: "Jane Doe" }
    const builder = createQueryBuilderMock({ data: profile, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await getProfile("user-1")

    expect(mockSupabase.from).toHaveBeenCalledWith("profiles")
    expect(builder.eq).toHaveBeenCalledWith("id", "user-1")
    expect(result).toEqual(profile)
  })

  it("throws when the query fails", async () => {
    const error = { message: "boom" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(getProfile("user-1")).rejects.toEqual(error)
  })
})

describe("updateProfile", () => {
  it("updates the profile's full name", async () => {
    const profile = { id: "user-1", full_name: "Jane Smith" }
    const builder = createQueryBuilderMock({ data: profile, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await updateProfile("user-1", "Jane Smith")

    expect(builder.update).toHaveBeenCalledWith({ full_name: "Jane Smith" })
    expect(builder.eq).toHaveBeenCalledWith("id", "user-1")
    expect(result).toEqual(profile)
  })

  it("throws when the update fails", async () => {
    const error = { message: "boom" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(updateProfile("user-1", "Jane Smith")).rejects.toEqual(error)
  })
})
