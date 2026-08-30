import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { listProjects, createProject, updateProject, setProjectStatus } = await import(
  "@/features/projects/services/project.service"
)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("listProjects", () => {
  it("lists projects for an organization ordered by name", async () => {
    const rows = [{ id: "p-1", name: "Website", status: "active", client: null }]
    const builder = createQueryBuilderMock({ data: rows, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await listProjects("org-1")

    expect(mockSupabase.from).toHaveBeenCalledWith("projects")
    expect(builder.eq).toHaveBeenCalledWith("organization_id", "org-1")
    expect(builder.order).toHaveBeenCalledWith("name", { ascending: true })
    expect(result).toEqual(rows)
  })

  it("throws when the query fails", async () => {
    const error = { message: "boom" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(listProjects("org-1")).rejects.toEqual(error)
  })
})

describe("createProject", () => {
  it("inserts a new project", async () => {
    const project = { id: "p-1", name: "Website" }
    const builder = createQueryBuilderMock({ data: project, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await createProject({
      organizationId: "org-1",
      name: "Website",
      clientId: null,
      color: "#3B82F6",
      description: undefined,
      createdBy: "user-1",
    })

    expect(mockSupabase.from).toHaveBeenCalledWith("projects")
    expect(builder.insert).toHaveBeenCalledWith({
      organization_id: "org-1",
      name: "Website",
      client_id: null,
      color: "#3B82F6",
      description: null,
      created_by: "user-1",
    })
    expect(result).toEqual(project)
  })
})

describe("updateProject", () => {
  it("updates the project's fields", async () => {
    const project = { id: "p-1", name: "New Name" }
    const builder = createQueryBuilderMock({ data: project, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await updateProject("p-1", {
      name: "New Name",
      clientId: "client-1",
      color: "#000000",
      description: "Updated",
    })

    expect(builder.update).toHaveBeenCalledWith({
      name: "New Name",
      client_id: "client-1",
      color: "#000000",
      description: "Updated",
    })
    expect(builder.eq).toHaveBeenCalledWith("id", "p-1")
    expect(result).toEqual(project)
  })
})

describe("setProjectStatus", () => {
  it("updates the project's status", async () => {
    const project = { id: "p-1", status: "archived" }
    const builder = createQueryBuilderMock({ data: project, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await setProjectStatus("p-1", "archived")

    expect(builder.update).toHaveBeenCalledWith({ status: "archived" })
    expect(builder.eq).toHaveBeenCalledWith("id", "p-1")
    expect(result).toEqual(project)
  })
})
