import { describe, expect, it } from "vitest"

import { formatOrgDate, formatOrgDayHeading, formatOrgTime } from "@/features/organizations/lib/date-time-format"

// Constructed from local components (not a "Z" UTC string) so the expected
// output below doesn't depend on the machine's local timezone — format()
// reads local getters either way, same as every other caller in this codebase.
const DATE = new Date(2026, 7, 24, 15, 5, 0)

describe("formatOrgDate", () => {
  it("formats MM/DD/YYYY", () => {
    expect(formatOrgDate(DATE, "MM/DD/YYYY")).toBe("08/24/2026")
  })

  it("formats DD/MM/YYYY", () => {
    expect(formatOrgDate(DATE, "DD/MM/YYYY")).toBe("24/08/2026")
  })

  it("formats YYYY-MM-DD", () => {
    expect(formatOrgDate(DATE, "YYYY-MM-DD")).toBe("2026-08-24")
  })
})

describe("formatOrgDayHeading", () => {
  it("puts the month before the day for MM/DD/YYYY", () => {
    expect(formatOrgDayHeading(DATE, "MM/DD/YYYY")).toBe("Monday, Aug 24")
  })

  it("puts the day before the month for DD/MM/YYYY", () => {
    expect(formatOrgDayHeading(DATE, "DD/MM/YYYY")).toBe("Monday, 24 Aug")
  })
})

describe("formatOrgTime", () => {
  it("formats 24-hour time", () => {
    expect(formatOrgTime(DATE, "24h")).toBe("15:05")
  })

  it("formats 12-hour time", () => {
    expect(formatOrgTime(DATE, "12h")).toBe("3:05 PM")
  })
})
