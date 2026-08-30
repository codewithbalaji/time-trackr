import { describe, expect, it } from "vitest"

import { timeEntrySchema } from "@/features/time-tracking/schemas/time-entry.schema"

const validInput = {
  description: "Created report",
  projectId: "project-1",
  date: "2026-08-30",
  startTime: "09:00",
  endTime: "10:00",
  isRunning: false,
}

describe("timeEntrySchema", () => {
  it("accepts a valid entry", () => {
    expect(timeEntrySchema.safeParse(validInput).success).toBe(true)
  })

  it("rejects an empty description", () => {
    const result = timeEntrySchema.safeParse({ ...validInput, description: "" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("Description is required")
  })

  it("rejects a missing project", () => {
    const result = timeEntrySchema.safeParse({ ...validInput, projectId: "" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("Project is required")
  })

  it("rejects an end time before the start time", () => {
    const result = timeEntrySchema.safeParse({ ...validInput, startTime: "10:00", endTime: "09:00" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("End time must be after start time")
  })

  it("rejects an end time equal to the start time", () => {
    const result = timeEntrySchema.safeParse({ ...validInput, startTime: "09:00", endTime: "09:00" })
    expect(result.success).toBe(false)
  })

  it("requires an end time unless the entry is running", () => {
    const result = timeEntrySchema.safeParse({ ...validInput, endTime: "" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("End time is required")
  })

  it("allows a missing end time while running", () => {
    const result = timeEntrySchema.safeParse({ ...validInput, endTime: "", isRunning: true })
    expect(result.success).toBe(true)
  })
})
