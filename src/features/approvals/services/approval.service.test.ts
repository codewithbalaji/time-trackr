import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { listPendingTimesheets, approveTimesheet, rejectTimesheet, listTimesheetHistory } =
  await import("@/features/approvals/services/approval.service")

beforeEach(() => {
  vi.clearAllMocks()
})

describe("listPendingTimesheets", () => {
  it("lists submitted timesheets for the org, oldest first", async () => {
    const rows = [{ id: "ts-1", status: "submitted" }]
    const builder = createQueryBuilderMock({ data: rows, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await listPendingTimesheets("org-1")

    expect(mockSupabase.from).toHaveBeenCalledWith("timesheets")
    expect(builder.eq).toHaveBeenCalledWith("organization_id", "org-1")
    expect(builder.eq).toHaveBeenCalledWith("status", "submitted")
    expect(builder.order).toHaveBeenCalledWith("submitted_at", { ascending: true })
    expect(result).toEqual(rows)
  })
})

describe("approveTimesheet", () => {
  it("calls the approve_timesheet rpc", async () => {
    const timesheet = { id: "ts-1", status: "approved" }
    mockSupabase.rpc.mockResolvedValue({ data: timesheet, error: null })

    const result = await approveTimesheet("org-1", "user-1", "2026-08-24")

    expect(mockSupabase.rpc).toHaveBeenCalledWith("approve_timesheet", {
      p_organization_id: "org-1",
      p_user_id: "user-1",
      p_period_start: "2026-08-24",
    })
    expect(result).toEqual(timesheet)
  })

  it("throws when the rpc fails", async () => {
    const error = { message: "timesheet_not_submitted" }
    mockSupabase.rpc.mockResolvedValue({ data: null, error })

    await expect(approveTimesheet("org-1", "user-1", "2026-08-24")).rejects.toEqual(error)
  })
})

describe("rejectTimesheet", () => {
  it("calls the reject_timesheet rpc with the reason", async () => {
    const timesheet = { id: "ts-1", status: "rejected" }
    mockSupabase.rpc.mockResolvedValue({ data: timesheet, error: null })

    const result = await rejectTimesheet("org-1", "user-1", "2026-08-24", "Missing hours")

    expect(mockSupabase.rpc).toHaveBeenCalledWith("reject_timesheet", {
      p_organization_id: "org-1",
      p_user_id: "user-1",
      p_period_start: "2026-08-24",
      p_reason: "Missing hours",
    })
    expect(result).toEqual(timesheet)
  })

  it("throws when the rpc fails", async () => {
    const error = { message: "rejection_reason_required" }
    mockSupabase.rpc.mockResolvedValue({ data: null, error })

    await expect(rejectTimesheet("org-1", "user-1", "2026-08-24", "")).rejects.toEqual(error)
  })
})

describe("listTimesheetHistory", () => {
  it("shapes audit log rows into history entries, resolving actor names", async () => {
    const auditRows = [
      {
        id: "log-1",
        created_at: "2026-08-25T10:00:00.000Z",
        actor_id: "user-2",
        metadata: { status: "approved" },
      },
      {
        id: "log-2",
        created_at: "2026-08-24T10:00:00.000Z",
        actor_id: "user-1",
        metadata: { status: "submitted" },
      },
    ]
    const actorRows = [
      { id: "user-2", full_name: "Ana Reviewer", email: "ana@example.com" },
      { id: "user-1", full_name: null, email: "sam@example.com" },
    ]
    const auditBuilder = createQueryBuilderMock({ data: auditRows, error: null })
    const profileBuilder = createQueryBuilderMock({ data: actorRows, error: null })
    mockSupabase.from.mockImplementation((table: string) =>
      table === "audit_logs" ? auditBuilder : profileBuilder
    )

    const result = await listTimesheetHistory("ts-1")

    expect(auditBuilder.eq).toHaveBeenCalledWith("target_type", "timesheets")
    expect(auditBuilder.eq).toHaveBeenCalledWith("target_id", "ts-1")
    expect(profileBuilder.in).toHaveBeenCalledWith("id", ["user-2", "user-1"])
    expect(result).toEqual([
      {
        id: "log-1",
        created_at: "2026-08-25T10:00:00.000Z",
        actor: { full_name: "Ana Reviewer", email: "ana@example.com" },
        status: "approved",
        rejection_reason: null,
      },
      {
        id: "log-2",
        created_at: "2026-08-24T10:00:00.000Z",
        actor: { full_name: null, email: "sam@example.com" },
        status: "submitted",
        rejection_reason: null,
      },
    ])
  })

  it("skips the profile lookup when there are no rows", async () => {
    const auditBuilder = createQueryBuilderMock({ data: [], error: null })
    mockSupabase.from.mockReturnValue(auditBuilder)

    const result = await listTimesheetHistory("ts-1")

    expect(mockSupabase.from).toHaveBeenCalledTimes(1)
    expect(result).toEqual([])
  })
})
