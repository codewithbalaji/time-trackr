import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { listProjectMembers, addProjectMember, removeProjectMember } = await import(
  "@/features/projects/services/project-members.service"
)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("listProjectMembers", () => {
  it("lists members assigned to a project", async () => {
    const rows = [{ id: "pm-1", profile: { id: "u-1", email: "a@b.com" } }]
    const builder = createQueryBuilderMock({ data: rows, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await listProjectMembers("p-1")

    expect(mockSupabase.from).toHaveBeenCalledWith("project_members")
    expect(builder.eq).toHaveBeenCalledWith("project_id", "p-1")
    expect(result).toEqual(rows)
  })

  it("throws when the query fails", async () => {
    const error = { message: "boom" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(listProjectMembers("p-1")).rejects.toEqual(error)
  })
})

describe("addProjectMember", () => {
  it("assigns a user to a project", async () => {
    const row = { id: "pm-1", project_id: "p-1", user_id: "u-1" }
    const builder = createQueryBuilderMock({ data: row, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await addProjectMember("p-1", "u-1")

    expect(builder.insert).toHaveBeenCalledWith({ project_id: "p-1", user_id: "u-1" })
    expect(result).toEqual(row)
  })
})

describe("removeProjectMember", () => {
  it("removes the assignment", async () => {
    const builder = createQueryBuilderMock({ data: null, error: null })
    mockSupabase.from.mockReturnValue(builder)

    await removeProjectMember("pm-1")

    expect(mockSupabase.from).toHaveBeenCalledWith("project_members")
    expect(builder.eq).toHaveBeenCalledWith("id", "pm-1")
  })

  it("throws when the delete fails", async () => {
    const error = { message: "boom" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(removeProjectMember("pm-1")).rejects.toEqual(error)
  })
})
