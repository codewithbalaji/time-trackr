import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const {
  getTimesheet,
  listEntriesForPeriod,
  submitTimesheet,
  withdrawTimesheet,
  resubmitTimesheet,
} = await import("@/features/timesheets/services/timesheet.service")

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getTimesheet", () => {
  it("looks up the timesheet for the organization, user, and week", async () => {
    const timesheet = { id: "ts-1", status: "draft" }
    const builder = createQueryBuilderMock({ data: timesheet, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await getTimesheet("org-1", "user-1", "2026-08-24")

    expect(mockSupabase.from).toHaveBeenCalledWith("timesheets")
    expect(builder.eq).toHaveBeenCalledWith("organization_id", "org-1")
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1")
    expect(builder.eq).toHaveBeenCalledWith("period_start", "2026-08-24")
    expect(result).toEqual(timesheet)
  })

  it("returns null when no timesheet exists yet for that week", async () => {
    const builder = createQueryBuilderMock({ data: null, error: null })
    mockSupabase.from.mockReturnValue(builder)

    expect(await getTimesheet("org-1", "user-1", "2026-08-24")).toBeNull()
  })
})

describe("listEntriesForPeriod", () => {
  it("filters entries to the given UTC range", async () => {
    const rows = [{ id: "te-1" }]
    const builder = createQueryBuilderMock({ data: rows, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await listEntriesForPeriod(
      "org-1",
      "user-1",
      "2026-08-24T04:00:00.000Z",
      "2026-08-31T04:00:00.000Z"
    )

    expect(builder.gte).toHaveBeenCalledWith("start_time", "2026-08-24T04:00:00.000Z")
    expect(builder.lt).toHaveBeenCalledWith("start_time", "2026-08-31T04:00:00.000Z")
    expect(result).toEqual(rows)
  })
})

describe("submitTimesheet", () => {
  it("calls the submit_timesheet rpc", async () => {
    const timesheet = { id: "ts-1", status: "submitted" }
    mockSupabase.rpc.mockResolvedValue({ data: timesheet, error: null })

    const result = await submitTimesheet("org-1", "2026-08-24")

    expect(mockSupabase.rpc).toHaveBeenCalledWith("submit_timesheet", {
      p_organization_id: "org-1",
      p_period_start: "2026-08-24",
    })
    expect(result).toEqual(timesheet)
  })

  it("throws when the rpc fails", async () => {
    const error = { message: "timer_running" }
    mockSupabase.rpc.mockResolvedValue({ data: null, error })

    await expect(submitTimesheet("org-1", "2026-08-24")).rejects.toEqual(error)
  })
})

describe("withdrawTimesheet", () => {
  it("calls the withdraw_timesheet rpc", async () => {
    const timesheet = { id: "ts-1", status: "draft" }
    mockSupabase.rpc.mockResolvedValue({ data: timesheet, error: null })

    const result = await withdrawTimesheet("org-1", "2026-08-24")

    expect(mockSupabase.rpc).toHaveBeenCalledWith("withdraw_timesheet", {
      p_organization_id: "org-1",
      p_period_start: "2026-08-24",
    })
    expect(result).toEqual(timesheet)
  })
})

describe("resubmitTimesheet", () => {
  it("calls the resubmit_timesheet rpc", async () => {
    const timesheet = { id: "ts-1", status: "submitted" }
    mockSupabase.rpc.mockResolvedValue({ data: timesheet, error: null })

    const result = await resubmitTimesheet("org-1", "2026-08-24")

    expect(mockSupabase.rpc).toHaveBeenCalledWith("resubmit_timesheet", {
      p_organization_id: "org-1",
      p_period_start: "2026-08-24",
    })
    expect(result).toEqual(timesheet)
  })

  it("throws when the rpc fails", async () => {
    const error = { message: "timesheet_not_rejected" }
    mockSupabase.rpc.mockResolvedValue({ data: null, error })

    await expect(resubmitTimesheet("org-1", "2026-08-24")).rejects.toEqual(error)
  })
})
