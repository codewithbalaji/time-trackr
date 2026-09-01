import { describe, expect, it } from "vitest"

import { rejectTimesheetSchema } from "@/features/approvals/schemas/reject-timesheet.schema"

describe("rejectTimesheetSchema", () => {
  it("accepts a trimmed, non-empty reason", () => {
    const result = rejectTimesheetSchema.safeParse({ reason: "  Missing Tuesday hours  " })
    expect(result.success).toBe(true)
    expect(result.data?.reason).toBe("Missing Tuesday hours")
  })

  it("rejects an empty reason", () => {
    const result = rejectTimesheetSchema.safeParse({ reason: "" })
    expect(result.success).toBe(false)
  })

  it("rejects a whitespace-only reason", () => {
    const result = rejectTimesheetSchema.safeParse({ reason: "   " })
    expect(result.success).toBe(false)
  })

  it("rejects a reason longer than 1000 characters", () => {
    const result = rejectTimesheetSchema.safeParse({ reason: "a".repeat(1001) })
    expect(result.success).toBe(false)
  })
})
