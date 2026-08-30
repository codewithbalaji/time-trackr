import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const {
  listTimeEntries,
  getRunningTimeEntry,
  startTimer,
  stopTimer,
  createManualEntry,
  updateTimeEntry,
  deleteTimeEntry,
} = await import("@/features/time-tracking/services/time-entry.service")

beforeEach(() => {
  vi.clearAllMocks()
})

describe("listTimeEntries", () => {
  it("lists completed entries for a user ordered by most recent start time", async () => {
    const rows = [{ id: "te-1", description: "Created report" }]
    const builder = createQueryBuilderMock({ data: rows, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await listTimeEntries("org-1", "user-1", "2026-08-01T00:00:00.000Z")

    expect(mockSupabase.from).toHaveBeenCalledWith("time_entries")
    expect(builder.eq).toHaveBeenCalledWith("organization_id", "org-1")
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1")
    expect(builder.not).toHaveBeenCalledWith("end_time", "is", null)
    expect(builder.gte).toHaveBeenCalledWith("start_time", "2026-08-01T00:00:00.000Z")
    expect(builder.order).toHaveBeenCalledWith("start_time", { ascending: false })
    expect(result).toEqual(rows)
  })

  it("throws when the query fails", async () => {
    const error = { message: "boom" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(listTimeEntries("org-1", "user-1", "2026-08-01T00:00:00.000Z")).rejects.toEqual(error)
  })
})

describe("getRunningTimeEntry", () => {
  it("returns the running entry, if any", async () => {
    const entry = { id: "te-1", end_time: null }
    const builder = createQueryBuilderMock({ data: entry, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await getRunningTimeEntry("org-1", "user-1")

    expect(builder.is).toHaveBeenCalledWith("end_time", null)
    expect(result).toEqual(entry)
  })
})

describe("startTimer", () => {
  it("calls the start_time_entry rpc", async () => {
    const entry = { id: "te-1" }
    mockSupabase.rpc.mockResolvedValue({ data: entry, error: null })

    const result = await startTimer({
      organizationId: "org-1",
      projectId: "project-1",
      description: "Created report",
    })

    expect(mockSupabase.rpc).toHaveBeenCalledWith("start_time_entry", {
      p_organization_id: "org-1",
      p_project_id: "project-1",
      p_description: "Created report",
    })
    expect(result).toEqual(entry)
  })

  it("throws when the rpc fails", async () => {
    const error = { message: "boom" }
    mockSupabase.rpc.mockResolvedValue({ data: null, error })

    await expect(
      startTimer({ organizationId: "org-1", projectId: "project-1", description: "x" })
    ).rejects.toEqual(error)
  })
})

describe("stopTimer", () => {
  it("sets end_time on the running entry", async () => {
    const entry = { id: "te-1", end_time: "2026-08-30T10:00:00.000Z" }
    const builder = createQueryBuilderMock({ data: entry, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await stopTimer("te-1")

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ end_time: expect.any(String) })
    )
    expect(builder.eq).toHaveBeenCalledWith("id", "te-1")
    expect(builder.is).toHaveBeenCalledWith("end_time", null)
    expect(result).toEqual(entry)
  })
})

describe("createManualEntry", () => {
  it("inserts a new entry with explicit start/end times", async () => {
    const entry = { id: "te-1" }
    const builder = createQueryBuilderMock({ data: entry, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await createManualEntry({
      organizationId: "org-1",
      userId: "user-1",
      projectId: "project-1",
      description: "Created report",
      startTime: "2026-08-30T09:00:00.000Z",
      endTime: "2026-08-30T10:00:00.000Z",
    })

    expect(builder.insert).toHaveBeenCalledWith({
      organization_id: "org-1",
      user_id: "user-1",
      project_id: "project-1",
      description: "Created report",
      start_time: "2026-08-30T09:00:00.000Z",
      end_time: "2026-08-30T10:00:00.000Z",
    })
    expect(result).toEqual(entry)
  })
})

describe("updateTimeEntry", () => {
  it("updates the entry's fields", async () => {
    const entry = { id: "te-1" }
    const builder = createQueryBuilderMock({ data: entry, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await updateTimeEntry("te-1", {
      projectId: "project-2",
      description: "Fixed bug",
      startTime: "2026-08-30T09:00:00.000Z",
      endTime: "2026-08-30T10:00:00.000Z",
    })

    expect(builder.update).toHaveBeenCalledWith({
      project_id: "project-2",
      description: "Fixed bug",
      start_time: "2026-08-30T09:00:00.000Z",
      end_time: "2026-08-30T10:00:00.000Z",
    })
    expect(builder.eq).toHaveBeenCalledWith("id", "te-1")
    expect(result).toEqual(entry)
  })

  it("omits end_time when editing a running entry", async () => {
    const entry = { id: "te-1" }
    const builder = createQueryBuilderMock({ data: entry, error: null })
    mockSupabase.from.mockReturnValue(builder)

    await updateTimeEntry("te-1", {
      projectId: "project-2",
      description: "Fixed bug",
      startTime: "2026-08-30T09:00:00.000Z",
    })

    expect(builder.update).toHaveBeenCalledWith({
      project_id: "project-2",
      description: "Fixed bug",
      start_time: "2026-08-30T09:00:00.000Z",
    })
  })
})

describe("deleteTimeEntry", () => {
  it("deletes the entry", async () => {
    const builder = createQueryBuilderMock({ data: null, error: null })
    mockSupabase.from.mockReturnValue(builder)

    await deleteTimeEntry("te-1")

    expect(mockSupabase.from).toHaveBeenCalledWith("time_entries")
    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenCalledWith("id", "te-1")
  })
})
