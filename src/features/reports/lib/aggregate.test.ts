import { describe, expect, it } from "vitest"

import {
  groupByDescription,
  groupByProject,
  hoursPerDay,
  topClient,
  topProject,
  totalDuration,
} from "@/features/reports/lib/aggregate"
import type { ReportEntry } from "@/features/reports/services/report.service"

function makeEntry(overrides: Partial<ReportEntry> = {}): ReportEntry {
  return {
    id: "entry-1",
    user_id: "user-1",
    description: "Writing docs",
    start_time: "2026-08-24T10:00:00.000Z",
    end_time: "2026-08-24T11:00:00.000Z",
    duration_seconds: 3600,
    created_at: "2026-08-24T10:00:00.000Z",
    project: { id: "proj-1", name: "Website", color: "#3366ff", client: { id: "client-1", name: "Acme" } },
    user: { id: "user-1", full_name: "Ana Reviewer", email: "ana@example.com" },
    ...overrides,
  }
}

describe("groupByProject", () => {
  it("sums duration per project, sorted desc", () => {
    const entries = [
      makeEntry({ id: "1", duration_seconds: 1800 }),
      makeEntry({
        id: "2",
        duration_seconds: 7200,
        project: { id: "proj-2", name: "Internal", color: "#000", client: null },
      }),
      makeEntry({ id: "3", duration_seconds: 900 }),
    ]

    expect(groupByProject(entries)).toEqual([
      { projectId: "proj-2", projectName: "Internal", color: "#000", totalSeconds: 7200 },
      { projectId: "proj-1", projectName: "Website", color: "#3366ff", totalSeconds: 2700 },
    ])
  })

  it("keeps the first-seen order on a tie", () => {
    const entries = [
      makeEntry({
        id: "1",
        duration_seconds: 3600,
        project: { id: "proj-b", name: "B", color: "#000", client: null },
      }),
      makeEntry({
        id: "2",
        duration_seconds: 3600,
        project: { id: "proj-a", name: "A", color: "#000", client: null },
      }),
    ]

    expect(groupByProject(entries).map((row) => row.projectId)).toEqual(["proj-b", "proj-a"])
  })
})

describe("groupByDescription", () => {
  it("groups by description text, falling back for a blank description", () => {
    const entries = [
      makeEntry({ id: "1", description: "Writing docs", duration_seconds: 1800 }),
      makeEntry({ id: "2", description: "Writing docs", duration_seconds: 1800 }),
      makeEntry({ id: "3", description: "  ", duration_seconds: 600 }),
    ]

    expect(groupByDescription(entries)).toEqual([
      { description: "Writing docs", totalSeconds: 3600 },
      { description: "(no description)", totalSeconds: 600 },
    ])
  })
})

describe("hoursPerDay", () => {
  it("zero-fills every day in the range, converting seconds to hours", () => {
    const entries = [
      makeEntry({ id: "1", start_time: "2026-08-24T10:00:00.000Z", duration_seconds: 3600 }),
      makeEntry({ id: "2", start_time: "2026-08-26T10:00:00.000Z", duration_seconds: 1800 }),
    ]

    expect(hoursPerDay(entries, "2026-08-24", "2026-08-26", "UTC")).toEqual([
      { dateKey: "2026-08-24", hours: 1 },
      { dateKey: "2026-08-25", hours: 0 },
      { dateKey: "2026-08-26", hours: 0.5 },
    ])
  })

  it("buckets by the given timezone, not UTC", () => {
    // 2026-08-25T02:00:00Z is still Aug 24 in America/New_York.
    const entries = [
      makeEntry({ id: "1", start_time: "2026-08-25T02:00:00.000Z", duration_seconds: 3600 }),
    ]

    expect(hoursPerDay(entries, "2026-08-24", "2026-08-25", "America/New_York")).toEqual([
      { dateKey: "2026-08-24", hours: 1 },
      { dateKey: "2026-08-25", hours: 0 },
    ])
  })
})

describe("topProject", () => {
  it("returns the highest-total project", () => {
    const entries = [
      makeEntry({ id: "1", duration_seconds: 1800 }),
      makeEntry({
        id: "2",
        duration_seconds: 7200,
        project: { id: "proj-2", name: "Internal", color: "#000", client: null },
      }),
    ]

    expect(topProject(entries)?.projectId).toBe("proj-2")
  })

  it("returns null for an empty list", () => {
    expect(topProject([])).toBeNull()
  })
})

describe("topClient", () => {
  it("returns the highest-total client, ignoring entries with no client", () => {
    const entries = [
      makeEntry({ id: "1", duration_seconds: 1800 }),
      makeEntry({
        id: "2",
        duration_seconds: 5400,
        project: { id: "proj-2", name: "Internal", color: "#000", client: null },
      }),
    ]

    expect(topClient(entries)).toEqual({
      clientId: "client-1",
      clientName: "Acme",
      totalSeconds: 1800,
    })
  })

  it("returns null when no entry has a client", () => {
    const entries = [
      makeEntry({
        id: "1",
        project: { id: "proj-2", name: "Internal", color: "#000", client: null },
      }),
    ]
    expect(topClient(entries)).toBeNull()
  })
})

describe("totalDuration", () => {
  it("sums duration_seconds across entries", () => {
    const entries = [
      makeEntry({ id: "1", duration_seconds: 1800 }),
      makeEntry({ id: "2", duration_seconds: 3600 }),
    ]
    expect(totalDuration(entries)).toBe(5400)
  })

  it("treats a running entry (null duration_seconds) as zero", () => {
    const entries = [
      makeEntry({ id: "1", duration_seconds: 1800 }),
      makeEntry({ id: "2", duration_seconds: null, end_time: null }),
    ]
    expect(totalDuration(entries)).toBe(1800)
  })
})
