import { describe, expect, it } from "vitest"

import { resolveDateRangePreset } from "@/features/reports/lib/date-range-presets"

// 2026-08-27 is a Thursday.
const NOW = new Date("2026-08-27T15:00:00Z")

describe("resolveDateRangePreset", () => {
  it("today resolves to a single-day range", () => {
    expect(resolveDateRangePreset("today", "UTC", NOW)).toEqual({
      start: "2026-08-27",
      end: "2026-08-27",
    })
  })

  it("this-week resolves to the Monday-Sunday week containing now", () => {
    expect(resolveDateRangePreset("this-week", "UTC", NOW)).toEqual({
      start: "2026-08-24",
      end: "2026-08-30",
    })
  })

  it("last-7-days resolves to a trailing 7-day window including today", () => {
    expect(resolveDateRangePreset("last-7-days", "UTC", NOW)).toEqual({
      start: "2026-08-21",
      end: "2026-08-27",
    })
  })

  it("this-month resolves to the full calendar month", () => {
    expect(resolveDateRangePreset("this-month", "UTC", NOW)).toEqual({
      start: "2026-08-01",
      end: "2026-08-31",
    })
  })

  it("yesterday resolves to the single day before now", () => {
    expect(resolveDateRangePreset("yesterday", "UTC", NOW)).toEqual({
      start: "2026-08-26",
      end: "2026-08-26",
    })
  })

  it("last-week resolves to the Monday-Sunday week before this-week", () => {
    expect(resolveDateRangePreset("last-week", "UTC", NOW)).toEqual({
      start: "2026-08-17",
      end: "2026-08-23",
    })
  })

  it("last-month resolves to the full previous calendar month", () => {
    expect(resolveDateRangePreset("last-month", "UTC", NOW)).toEqual({
      start: "2026-07-01",
      end: "2026-07-31",
    })
  })

  it("this-year resolves to the full calendar year", () => {
    expect(resolveDateRangePreset("this-year", "UTC", NOW)).toEqual({
      start: "2026-01-01",
      end: "2026-12-31",
    })
  })

  it("last-year resolves to the full previous calendar year", () => {
    expect(resolveDateRangePreset("last-year", "UTC", NOW)).toEqual({
      start: "2025-01-01",
      end: "2025-12-31",
    })
  })

  it("resolves against the given timezone, not UTC", () => {
    // 2026-08-27T02:00:00Z is still Aug 26 in America/New_York.
    const lateNightUtc = new Date("2026-08-27T02:00:00Z")
    expect(resolveDateRangePreset("today", "America/New_York", lateNightUtc)).toEqual({
      start: "2026-08-26",
      end: "2026-08-26",
    })
  })
})
