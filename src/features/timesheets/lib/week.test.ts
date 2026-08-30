import { describe, expect, it } from "vitest"

import {
  formatWeekRange,
  getEntryDateKey,
  getPeriodUtcBounds,
  getWeekDays,
  getWeekStart,
  shiftWeek,
} from "@/features/timesheets/lib/week"

describe("getWeekStart", () => {
  it("returns the same date when it's already a Monday", () => {
    // 2026-08-24 is a Monday.
    expect(getWeekStart(new Date("2026-08-24T12:00:00Z"), "UTC")).toBe("2026-08-24")
  })

  it("returns the prior Monday for a mid-week date", () => {
    // 2026-08-27 is a Thursday.
    expect(getWeekStart(new Date("2026-08-27T12:00:00Z"), "UTC")).toBe("2026-08-24")
  })

  it("returns the prior Monday for a Sunday", () => {
    expect(getWeekStart(new Date("2026-08-30T12:00:00Z"), "UTC")).toBe("2026-08-24")
  })

  it("computes the week boundary against the given timezone, not UTC", () => {
    // 2026-08-24T02:00:00Z is Sunday 22:00 in America/New_York (UTC-4 in August) —
    // still the prior week there, even though it's already Monday in UTC.
    expect(getWeekStart(new Date("2026-08-24T02:00:00Z"), "America/New_York")).toBe("2026-08-17")
  })
})

describe("shiftWeek", () => {
  it("moves forward by whole weeks", () => {
    expect(shiftWeek("2026-08-24", 1)).toBe("2026-08-31")
  })

  it("moves backward by whole weeks", () => {
    expect(shiftWeek("2026-08-24", -1)).toBe("2026-08-17")
  })
})

describe("getWeekDays", () => {
  it("returns all 7 days starting from period_start", () => {
    const days = getWeekDays("2026-08-24")
    expect(days).toHaveLength(7)
    expect(days[0].getDate()).toBe(24)
    expect(days[6].getDate()).toBe(30)
  })
})

describe("formatWeekRange", () => {
  it("formats a range within the same month", () => {
    expect(formatWeekRange("2026-08-24")).toBe("Aug 24 – 30, 2026")
  })

  it("formats a range spanning two months", () => {
    expect(formatWeekRange("2026-08-31")).toBe("Aug 31 – Sep 6, 2026")
  })
})

describe("getEntryDateKey", () => {
  it("buckets a timestamp by the given timezone's calendar date", () => {
    // 2026-08-25T02:00:00Z is still Aug 24 in America/New_York.
    expect(getEntryDateKey("2026-08-25T02:00:00.000Z", "America/New_York")).toBe("2026-08-24")
    expect(getEntryDateKey("2026-08-25T02:00:00.000Z", "UTC")).toBe("2026-08-25")
  })
})

describe("getPeriodUtcBounds", () => {
  it("returns a 7-day UTC range anchored to the timezone's midnight", () => {
    const { startIso, endIso } = getPeriodUtcBounds("2026-08-24", "America/New_York")
    expect(startIso).toBe("2026-08-24T04:00:00.000Z")
    expect(endIso).toBe("2026-08-31T04:00:00.000Z")
  })
})
