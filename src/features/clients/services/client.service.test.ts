import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { listClients, createClient, updateClientName, setClientStatus } = await import(
  "@/features/clients/services/client.service"
)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("listClients", () => {
  it("lists clients for an organization ordered by name", async () => {
    const rows = [{ id: "c-1", name: "Acme", status: "active", created_at: "now" }]
    const builder = createQueryBuilderMock({ data: rows, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await listClients("org-1")

    expect(mockSupabase.from).toHaveBeenCalledWith("clients")
    expect(builder.eq).toHaveBeenCalledWith("organization_id", "org-1")
    expect(builder.order).toHaveBeenCalledWith("name", { ascending: true })
    expect(result).toEqual(rows)
  })

  it("throws when the query fails", async () => {
    const error = { message: "boom" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(listClients("org-1")).rejects.toEqual(error)
  })
})

describe("createClient", () => {
  it("inserts a new client", async () => {
    const client = { id: "c-1", name: "Acme", status: "active" }
    const builder = createQueryBuilderMock({ data: client, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await createClient({
      organizationId: "org-1",
      name: "Acme",
      createdBy: "user-1",
    })

    expect(mockSupabase.from).toHaveBeenCalledWith("clients")
    expect(builder.insert).toHaveBeenCalledWith({
      organization_id: "org-1",
      name: "Acme",
      created_by: "user-1",
    })
    expect(result).toEqual(client)
  })

  it("throws when the insert fails", async () => {
    const error = { message: "23505" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(
      createClient({ organizationId: "org-1", name: "Acme", createdBy: "user-1" })
    ).rejects.toEqual(error)
  })
})

describe("updateClientName", () => {
  it("updates the client's name", async () => {
    const client = { id: "c-1", name: "New Name" }
    const builder = createQueryBuilderMock({ data: client, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await updateClientName("c-1", "New Name")

    expect(builder.update).toHaveBeenCalledWith({ name: "New Name" })
    expect(builder.eq).toHaveBeenCalledWith("id", "c-1")
    expect(result).toEqual(client)
  })
})

describe("setClientStatus", () => {
  it("updates the client's status", async () => {
    const client = { id: "c-1", status: "archived" }
    const builder = createQueryBuilderMock({ data: client, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await setClientStatus("c-1", "archived")

    expect(builder.update).toHaveBeenCalledWith({ status: "archived" })
    expect(builder.eq).toHaveBeenCalledWith("id", "c-1")
    expect(result).toEqual(client)
  })
})
