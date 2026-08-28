import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { listRoles, hasPermission, assignMembershipRole } = await import(
  "@/features/roles/services/role.service"
)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("listRoles", () => {
  it("lists roles for an organization ordered by name", async () => {
    const rows = [{ id: "r-1", name: "Admin", is_system: true }]
    const builder = createQueryBuilderMock({ data: rows, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await listRoles("org-1")

    expect(mockSupabase.from).toHaveBeenCalledWith("roles")
    expect(builder.eq).toHaveBeenCalledWith("organization_id", "org-1")
    expect(builder.order).toHaveBeenCalledWith("name", { ascending: true })
    expect(result).toEqual(rows)
  })

  it("throws when the query fails", async () => {
    const error = { message: "boom" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(listRoles("org-1")).rejects.toEqual(error)
  })
})

describe("hasPermission", () => {
  it("calls the has_permission RPC and returns its boolean result", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: true, error: null })

    const result = await hasPermission("org-1", "roles.assign")

    expect(mockSupabase.rpc).toHaveBeenCalledWith("has_permission", {
      p_organization_id: "org-1",
      p_permission_key: "roles.assign",
    })
    expect(result).toBe(true)
  })

  it("defaults to false when the RPC returns no data", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

    const result = await hasPermission("org-1", "roles.assign")

    expect(result).toBe(false)
  })

  it("throws the Supabase error", async () => {
    const error = { message: "boom" }
    mockSupabase.rpc.mockResolvedValue({ data: null, error })

    await expect(hasPermission("org-1", "roles.assign")).rejects.toEqual(error)
  })
})

describe("assignMembershipRole", () => {
  it("calls the assign_membership_role RPC with the membership and role ids", async () => {
    const membership = { id: "m-1", role_id: "r-2" }
    mockSupabase.rpc.mockResolvedValue({ data: membership, error: null })

    const result = await assignMembershipRole("m-1", "r-2")

    expect(mockSupabase.rpc).toHaveBeenCalledWith("assign_membership_role", {
      p_membership_id: "m-1",
      p_role_id: "r-2",
    })
    expect(result).toEqual(membership)
  })

  it("throws the Supabase error", async () => {
    const error = { message: "insufficient_permissions" }
    mockSupabase.rpc.mockResolvedValue({ data: null, error })

    await expect(assignMembershipRole("m-1", "r-2")).rejects.toEqual(error)
  })
})
