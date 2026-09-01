import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()

vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const {
  listNotifications,
  listRecentNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} = await import("@/features/notifications/services/notification.service")

beforeEach(() => {
  vi.clearAllMocks()
})

describe("listNotifications", () => {
  it("lists notifications for the org, newest first, limited", async () => {
    const rows = [{ id: "n-1" }]
    const builder = createQueryBuilderMock({ data: rows, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await listNotifications("org-1", { limit: 5 })

    expect(mockSupabase.from).toHaveBeenCalledWith("notifications")
    expect(builder.eq).toHaveBeenCalledWith("organization_id", "org-1")
    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: false })
    expect(builder.limit).toHaveBeenCalledWith(5)
    expect(result).toEqual(rows)
  })
})

describe("listRecentNotifications", () => {
  it("defaults to a bounded limit", async () => {
    const rows = [{ id: "n-1" }]
    const builder = createQueryBuilderMock({ data: rows, error: null })
    mockSupabase.from.mockReturnValue(builder)

    const result = await listRecentNotifications("org-1")

    expect(builder.limit).toHaveBeenCalledWith(8)
    expect(result).toEqual(rows)
  })
})

describe("getUnreadNotificationCount", () => {
  it("counts unread notifications for the org", async () => {
    const mockResult: { data: unknown; error: unknown; count: number } = {
      data: null,
      error: null,
      count: 3,
    }
    const builder = createQueryBuilderMock(mockResult)
    mockSupabase.from.mockReturnValue(builder)

    const result = await getUnreadNotificationCount("org-1")

    expect(builder.select).toHaveBeenCalledWith("id", { count: "exact", head: true })
    expect(builder.eq).toHaveBeenCalledWith("organization_id", "org-1")
    expect(builder.is).toHaveBeenCalledWith("read_at", null)
    expect(result).toBe(3)
  })

  it("returns 0 when count is null", async () => {
    const mockResult: { data: unknown; error: unknown; count: number | null } = {
      data: null,
      error: null,
      count: null,
    }
    const builder = createQueryBuilderMock(mockResult)
    mockSupabase.from.mockReturnValue(builder)

    const result = await getUnreadNotificationCount("org-1")

    expect(result).toBe(0)
  })
})

describe("markNotificationRead", () => {
  it("updates read_at for the given notification", async () => {
    const builder = createQueryBuilderMock({ data: null, error: null })
    mockSupabase.from.mockReturnValue(builder)

    await markNotificationRead("n-1")

    expect(mockSupabase.from).toHaveBeenCalledWith("notifications")
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ read_at: expect.any(String) }))
    expect(builder.eq).toHaveBeenCalledWith("id", "n-1")
    expect(builder.is).toHaveBeenCalledWith("read_at", null)
  })

  it("throws when the update fails", async () => {
    const error = { message: "boom" }
    const builder = createQueryBuilderMock({ data: null, error })
    mockSupabase.from.mockReturnValue(builder)

    await expect(markNotificationRead("n-1")).rejects.toEqual(error)
  })
})

describe("markAllNotificationsRead", () => {
  it("updates every unread notification for the org", async () => {
    const builder = createQueryBuilderMock({ data: null, error: null })
    mockSupabase.from.mockReturnValue(builder)

    await markAllNotificationsRead("org-1")

    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ read_at: expect.any(String) }))
    expect(builder.eq).toHaveBeenCalledWith("organization_id", "org-1")
    expect(builder.is).toHaveBeenCalledWith("read_at", null)
  })
})
