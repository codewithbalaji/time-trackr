import { describe, expect, it } from "vitest"

import { formatDuration } from "@/features/time-tracking/lib/format-duration"

describe("formatDuration", () => {
  it("formats zero seconds", () => {
    expect(formatDuration(0)).toBe("00:00:00")
  })

  it("formats minutes and seconds", () => {
    expect(formatDuration(125)).toBe("00:02:05")
  })

  it("formats exactly one hour", () => {
    expect(formatDuration(3600)).toBe("01:00:00")
  })

  it("formats durations over 24 hours", () => {
    expect(formatDuration(90000)).toBe("25:00:00")
  })

  it("clamps negative durations to zero", () => {
    expect(formatDuration(-5)).toBe("00:00:00")
  })
})
