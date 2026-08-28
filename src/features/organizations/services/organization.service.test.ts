import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { createOrganizationWithOwner, getMembershipsForUser } = await import(
  "@/features/organizations/services/organization.service"
)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createOrganizationWithOwner", () => {
  it("calls the create_organization_with_owner RPC with the given name", async () => {
    const org = { id: "org-1", name: "Acme" }
    mockSupabase.rpc.mockResolvedValue({ data: org, error: null })

    const result = await createOrganizationWithOwner("Acme")

    expect(mockSupabase.rpc).toHaveBeenCalledWith("create_organization_with_owner", {
      p_name: "Acme",
    })
    expect(result).toEqual(org)
  })

  it("throws the Supabase error", async () => {
    const error = { message: "unexpected", code: "P0001" }
    mockSupabase.rpc.mockResolvedValue({ data: null, error })

    await expect(createOrganizationWithOwner("Acme")).rejects.toEqual(error)
  })
})

describe("getMembershipsForUser", () => {
  it("queries memberships by user_id and returns every row (a user can belong to more than one org)", async () => {
    const memberships = [
      { id: "m-1", role: "owner", organization: { id: "org-1", name: "Acme" } },
      { id: "m-2", role: "member", organization: { id: "org-2", name: "Widgets Co" } },
    ]
    const builder = createQueryBuilderMock({ data: memberships, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await getMembershipsForUser("user-1")

    expect(mockSupabase.from).toHaveBeenCalledWith("memberships")
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1")
    expect(result).toEqual(memberships)
  })

  it("returns an empty array when the user hasn't joined any organization yet", async () => {
    const builder = createQueryBuilderMock({ data: [], error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await getMembershipsForUser("user-1")

    expect(result).toEqual([])
  })

  it("throws the Supabase error", async () => {
    const error = { message: "fail", code: "x" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(getMembershipsForUser("user-1")).rejects.toEqual(error)
  })
})
