import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { listOrgMembers, updateMembershipStatus, removeMember } = await import(
  "@/features/users/services/membership.service"
)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("listOrgMembers", () => {
  it("lists members for an organization ordered by join date", async () => {
    const rows = [{ id: "m-1", role: { id: "r-1", name: "Owner" }, status: "active" }]
    const builder = createQueryBuilderMock({ data: rows, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await listOrgMembers("org-1")

    expect(mockSupabase.from).toHaveBeenCalledWith("memberships")
    expect(builder.eq).toHaveBeenCalledWith("organization_id", "org-1")
    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: true })
    expect(result).toEqual(rows)
  })

  it("throws when the query fails", async () => {
    const error = { message: "boom" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(listOrgMembers("org-1")).rejects.toEqual(error)
  })
})

describe("updateMembershipStatus", () => {
  it("updates the membership status", async () => {
    const membership = { id: "m-1", status: "suspended" }
    const builder = createQueryBuilderMock({ data: membership, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await updateMembershipStatus("m-1", "suspended")

    expect(builder.update).toHaveBeenCalledWith({ status: "suspended" })
    expect(builder.eq).toHaveBeenCalledWith("id", "m-1")
    expect(result).toEqual(membership)
  })
})

describe("removeMember", () => {
  it("deletes the membership", async () => {
    const builder = createQueryBuilderMock({ data: null, error: null })
    mockSupabase.from.mockReturnValue(builder)

    await removeMember("m-1")

    expect(mockSupabase.from).toHaveBeenCalledWith("memberships")
    expect(builder.eq).toHaveBeenCalledWith("id", "m-1")
  })

  it("throws when the delete fails", async () => {
    const error = { message: "boom" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(removeMember("m-1")).rejects.toEqual(error)
  })
})
