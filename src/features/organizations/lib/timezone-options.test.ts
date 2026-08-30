import { describe, expect, it } from "vitest"

import {
  findTimezoneOption,
  getTimezoneOptions,
  searchTimezoneOptions,
} from "@/features/organizations/lib/timezone-options"

const REFERENCE_DATE = new Date("2026-08-24T12:00:00.000Z")

describe("getTimezoneOptions", () => {
  it("uses the modern city name as the id, not a legacy alias", () => {
    const options = getTimezoneOptions(REFERENCE_DATE)
    expect(findTimezoneOption(options, "Asia/Kolkata")).toBeDefined()
    expect(findTimezoneOption(options, "Asia/Calcutta")).toBeUndefined()
  })

  it("formats a friendly label with offset, long name, and country", () => {
    const options = getTimezoneOptions(REFERENCE_DATE)
    const kolkata = findTimezoneOption(options, "Asia/Kolkata")

    expect(kolkata?.offsetLabel).toBe("UTC+05:30")
    expect(kolkata?.longName).toBe("India Standard Time")
    expect(kolkata?.country).toBe("India")
    expect(kolkata?.label).toBe("(UTC+05:30) India Standard Time")
  })

  it("formats a negative offset", () => {
    const options = getTimezoneOptions(REFERENCE_DATE)
    // America/New_York observes EDT (UTC-4) in August.
    expect(findTimezoneOption(options, "America/New_York")?.offsetLabel).toBe("UTC-04:00")
  })

  it("sorts by UTC offset, then alphabetically by id", () => {
    const options = getTimezoneOptions(REFERENCE_DATE)
    for (let i = 1; i < options.length; i++) {
      const previous = options[i - 1]
      const current = options[i]
      const inOrder =
        previous.offsetMinutes < current.offsetMinutes ||
        (previous.offsetMinutes === current.offsetMinutes &&
          previous.value.localeCompare(current.value) <= 0)
      expect(inOrder).toBe(true)
    }
  })
})

describe("findTimezoneOption", () => {
  it("returns undefined for an unknown id", () => {
    expect(findTimezoneOption(getTimezoneOptions(REFERENCE_DATE), "Not/A_Zone")).toBeUndefined()
  })
})

describe("searchTimezoneOptions", () => {
  const options = getTimezoneOptions(REFERENCE_DATE)

  it("returns everything for an empty query", () => {
    expect(searchTimezoneOptions(options, "  ")).toEqual(options)
  })

  it("matches by country name, case-insensitively", () => {
    const results = searchTimezoneOptions(options, "InDiA")
    expect(results.map((option) => option.value)).toContain("Asia/Kolkata")
    // Sri Lanka's zone shares India's exact offset with no DST, so ICU
    // itself labels it "India Standard Time" too — a defensible match, not
    // the false-positive this test suite guards against (see the next test).
    expect(results.map((option) => option.value)).toContain("Asia/Colombo")
  })

  it("does not match unrelated America/Indiana zones when searching a country name that's a prefix of a different word", () => {
    const results = searchTimezoneOptions(options, "india")
    expect(results.some((option) => option.value.startsWith("America/Indiana"))).toBe(false)
    expect(results.some((option) => option.value === "America/New_York")).toBe(false)
  })

  it("still finds a zone by a partial city/id name when the query isn't a country name", () => {
    const results = searchTimezoneOptions(options, "kolk")
    expect(results.map((option) => option.value)).toContain("Asia/Kolkata")
  })

  it("matches by partial friendly (long) name", () => {
    const results = searchTimezoneOptions(options, "eastern euro")
    expect(results.length).toBeGreaterThan(0)
    for (const option of results) {
      expect(option.longName.toLowerCase()).toContain("eastern european")
    }
  })

  it("matches a full IANA id typed from the start", () => {
    const results = searchTimezoneOptions(options, "asia/kolk")
    expect(results.map((option) => option.value)).toEqual(["Asia/Kolkata"])
  })
})
