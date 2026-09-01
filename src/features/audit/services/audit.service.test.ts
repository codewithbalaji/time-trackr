import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { listAuditLogs } = await import("@/features/audit/services/audit.service")

beforeEach(() => {
  vi.clearAllMocks()
})

describe("listAuditLogs", () => {
  it("shapes audit log rows into entries, resolving actor names", async () => {
    const auditRows = [
      {
        id: "log-1",
        created_at: "2026-09-01T10:00:00.000Z",
        actor_id: "user-2",
        action: "organizations_updated",
        target_type: "organizations",
        target_id: "org-1",
        metadata: { name: "Acme" },
      },
      {
        id: "log-2",
        created_at: "2026-08-31T10:00:00.000Z",
        actor_id: null,
        action: "timesheet_reminder_sent",
        target_type: "timesheets",
        target_id: "ts-1",
        metadata: {},
      },
    ]
    const actorRows = [{ id: "user-2", full_name: "Ana Owner", email: "ana@example.com" }]
    const auditBuilder = createQueryBuilderMock({ data: auditRows, error: null })
    const profileBuilder = createQueryBuilderMock({ data: actorRows, error: null })
    mockSupabase.from.mockImplementation((table: string) =>
      table === "audit_logs" ? auditBuilder : profileBuilder
    )

    const result = await listAuditLogs("org-1", { limit: 20 })

    expect(mockSupabase.from).toHaveBeenCalledWith("audit_logs")
    expect(auditBuilder.eq).toHaveBeenCalledWith("organization_id", "org-1")
    expect(auditBuilder.order).toHaveBeenCalledWith("created_at", { ascending: false })
    expect(auditBuilder.limit).toHaveBeenCalledWith(20)
    expect(profileBuilder.in).toHaveBeenCalledWith("id", ["user-2"])
    expect(result).toEqual([
      {
        id: "log-1",
        created_at: "2026-09-01T10:00:00.000Z",
        actor: { full_name: "Ana Owner", email: "ana@example.com" },
        action: "organizations_updated",
        target_type: "organizations",
        target_id: "org-1",
        metadata: { name: "Acme" },
      },
      {
        id: "log-2",
        created_at: "2026-08-31T10:00:00.000Z",
        actor: null,
        action: "timesheet_reminder_sent",
        target_type: "timesheets",
        target_id: "ts-1",
        metadata: {},
      },
    ])
  })

  it("skips the profile lookup when there are no rows", async () => {
    const auditBuilder = createQueryBuilderMock({ data: [], error: null })
    mockSupabase.from.mockReturnValue(auditBuilder)

    const result = await listAuditLogs("org-1")

    expect(mockSupabase.from).toHaveBeenCalledTimes(1)
    expect(result).toEqual([])
  })
})
