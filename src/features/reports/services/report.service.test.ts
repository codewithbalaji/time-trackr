import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { listOwnEntriesInRange, listOrgEntriesInRange } = await import(
  "@/features/reports/services/report.service"
)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("listOwnEntriesInRange", () => {
  it("scopes to the org, the user, and the [start, end) range, excluding running entries", async () => {
    const rows = [{ id: "entry-1" }]
    const builder = createQueryBuilderMock({ data: rows, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await listOwnEntriesInRange(
      "org-1",
      "user-1",
      "2026-08-24T00:00:00.000Z",
      "2026-08-31T00:00:00.000Z"
    )

    expect(mockSupabase.from).toHaveBeenCalledWith("time_entries")
    expect(builder.eq).toHaveBeenCalledWith("organization_id", "org-1")
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1")
    expect(builder.gte).toHaveBeenCalledWith("start_time", "2026-08-24T00:00:00.000Z")
    expect(builder.lt).toHaveBeenCalledWith("start_time", "2026-08-31T00:00:00.000Z")
    expect(builder.not).toHaveBeenCalledWith("end_time", "is", null)
    expect(builder.order).toHaveBeenCalledWith("start_time", { ascending: true })
    expect(result).toEqual(rows)
  })

  it("throws when the query errors", async () => {
    const error = { message: "boom" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(
      listOwnEntriesInRange("org-1", "user-1", "2026-08-24T00:00:00.000Z", "2026-08-31T00:00:00.000Z")
    ).rejects.toEqual(error)
  })
})

describe("listOrgEntriesInRange", () => {
  it("scopes to the org and range only — no user_id filter, RLS is the boundary", async () => {
    const rows = [{ id: "entry-1" }, { id: "entry-2" }]
    const builder = createQueryBuilderMock({ data: rows, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await listOrgEntriesInRange(
      "org-1",
      "2026-08-24T00:00:00.000Z",
      "2026-08-31T00:00:00.000Z"
    )

    expect(mockSupabase.from).toHaveBeenCalledWith("time_entries")
    expect(builder.eq).toHaveBeenCalledWith("organization_id", "org-1")
    expect(builder.eq).not.toHaveBeenCalledWith("user_id", expect.anything())
    expect(builder.gte).toHaveBeenCalledWith("start_time", "2026-08-24T00:00:00.000Z")
    expect(builder.lt).toHaveBeenCalledWith("start_time", "2026-08-31T00:00:00.000Z")
    expect(builder.not).toHaveBeenCalledWith("end_time", "is", null)
    expect(result).toEqual(rows)
  })

  it("throws when the query errors", async () => {
    const error = { message: "boom" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(
      listOrgEntriesInRange("org-1", "2026-08-24T00:00:00.000Z", "2026-08-31T00:00:00.000Z")
    ).rejects.toEqual(error)
  })
})
