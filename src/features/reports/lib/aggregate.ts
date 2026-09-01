import { addDays, format } from "date-fns"

import { getEntryDateKey } from "@/features/timesheets/lib/week"
import type { ReportEntry } from "@/features/reports/services/report.service"

const DATE_KEY_FORMAT = "yyyy-MM-dd"

export type ProjectTotal = {
  projectId: string
  projectName: string
  color: string
  totalSeconds: number
}

// Sorted desc by total time — ties keep the order the project was first seen
// in `entries` (a Map's iteration order), which is stable since report.service
// always orders entries by start_time ascending.
export function groupByProject(entries: ReportEntry[]): ProjectTotal[] {
  const totals = new Map<string, ProjectTotal>()
  for (const entry of entries) {
    const seconds = entry.duration_seconds ?? 0
    const existing = totals.get(entry.project.id)
    if (existing) {
      existing.totalSeconds += seconds
    } else {
      totals.set(entry.project.id, {
        projectId: entry.project.id,
        projectName: entry.project.name,
        color: entry.project.color,
        totalSeconds: seconds,
      })
    }
  }
  return [...totals.values()].sort((a, b) => b.totalSeconds - a.totalSeconds)
}

export type DescriptionTotal = { description: string; totalSeconds: number }

export function groupByDescription(entries: ReportEntry[]): DescriptionTotal[] {
  const totals = new Map<string, DescriptionTotal>()
  for (const entry of entries) {
    const key = entry.description.trim() || "(no description)"
    const seconds = entry.duration_seconds ?? 0
    const existing = totals.get(key)
    if (existing) {
      existing.totalSeconds += seconds
    } else {
      totals.set(key, { description: key, totalSeconds: seconds })
    }
  }
  return [...totals.values()].sort((a, b) => b.totalSeconds - a.totalSeconds)
}

export type DayHours = { dateKey: string; hours: number }

// Zero-filled for every day in [rangeStart, rangeEnd] (inclusive yyyy-MM-dd
// date keys) so HoursBarChart never renders a gap for a day with no entries.
export function hoursPerDay(
  entries: ReportEntry[],
  rangeStart: string,
  rangeEnd: string,
  timezone: string
): DayHours[] {
  const secondsByDay = new Map<string, number>()
  for (const entry of entries) {
    const dayKey = getEntryDateKey(entry.start_time, timezone)
    secondsByDay.set(dayKey, (secondsByDay.get(dayKey) ?? 0) + (entry.duration_seconds ?? 0))
  }

  const days: DayHours[] = []
  let cursor = parseDateKey(rangeStart)
  const end = parseDateKey(rangeEnd)
  while (cursor <= end) {
    const dateKey = format(cursor, DATE_KEY_FORMAT)
    days.push({ dateKey, hours: (secondsByDay.get(dateKey) ?? 0) / 3600 })
    cursor = addDays(cursor, 1)
  }
  return days
}

export function topProject(entries: ReportEntry[]): ProjectTotal | null {
  return groupByProject(entries)[0] ?? null
}

export type ClientTotal = { clientId: string; clientName: string; totalSeconds: number }

export function topClient(entries: ReportEntry[]): ClientTotal | null {
  const totals = new Map<string, ClientTotal>()
  for (const entry of entries) {
    const client = entry.project.client
    if (!client) continue
    const seconds = entry.duration_seconds ?? 0
    const existing = totals.get(client.id)
    if (existing) {
      existing.totalSeconds += seconds
    } else {
      totals.set(client.id, {
        clientId: client.id,
        clientName: client.name,
        totalSeconds: seconds,
      })
    }
  }
  return [...totals.values()].sort((a, b) => b.totalSeconds - a.totalSeconds)[0] ?? null
}

// duration_seconds is null only for a currently-running entry; report.service
// already excludes those at the query level (`.not("end_time", "is", null)`)
// — this is a safety net for callers that pass raw entries directly.
export function totalDuration(entries: ReportEntry[]): number {
  return entries.reduce((sum, entry) => sum + (entry.duration_seconds ?? 0), 0)
}

function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`)
}
