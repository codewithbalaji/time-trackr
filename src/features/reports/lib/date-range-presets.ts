import { TZDate } from "@date-fns/tz"
import { addDays, endOfMonth, endOfYear, format, startOfMonth, startOfYear, subMonths, subYears } from "date-fns"

import { getWeekDays, getWeekStart, shiftWeek } from "@/features/timesheets/lib/week"

const DATE_KEY_FORMAT = "yyyy-MM-dd"

export type DateRange = { start: string; end: string }
export type DateRangePresetKey =
  | "today"
  | "yesterday"
  | "this-week"
  | "last-week"
  | "last-7-days"
  | "this-month"
  | "last-month"
  | "this-year"
  | "last-year"

export const DATE_RANGE_PRESETS: { key: DateRangePresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this-week", label: "This week" },
  { key: "last-week", label: "Last week" },
  { key: "last-7-days", label: "Last 7 days" },
  { key: "this-month", label: "This month" },
  { key: "last-month", label: "Last month" },
  { key: "this-year", label: "This year" },
  { key: "last-year", label: "Last year" },
]

// Resolves a named preset to an inclusive [start, end] pair of yyyy-MM-dd
// date keys, anchored to the organization's timezone (not the browser's) so
// every member sees the same range — matches week.ts's date-key convention
// and reuses its Monday-start week helpers rather than reimplementing them.
// `now` is injectable for tests.
export function resolveDateRangePreset(
  key: DateRangePresetKey,
  timezone: string,
  now: Date = new Date()
): DateRange {
  const zoned = new TZDate(now, timezone)
  const todayKey = format(zoned, DATE_KEY_FORMAT)

  switch (key) {
    case "today":
      return { start: todayKey, end: todayKey }
    case "yesterday": {
      const yesterdayKey = format(addDays(zoned, -1), DATE_KEY_FORMAT)
      return { start: yesterdayKey, end: yesterdayKey }
    }
    case "this-week": {
      const start = getWeekStart(now, timezone)
      const days = getWeekDays(start)
      return { start, end: format(days[6], DATE_KEY_FORMAT) }
    }
    case "last-week": {
      const start = shiftWeek(getWeekStart(now, timezone), -1)
      const days = getWeekDays(start)
      return { start, end: format(days[6], DATE_KEY_FORMAT) }
    }
    case "last-7-days":
      return { start: format(addDays(zoned, -6), DATE_KEY_FORMAT), end: todayKey }
    case "this-month":
      return {
        start: format(startOfMonth(zoned), DATE_KEY_FORMAT),
        end: format(endOfMonth(zoned), DATE_KEY_FORMAT),
      }
    case "last-month": {
      const lastMonth = subMonths(zoned, 1)
      return {
        start: format(startOfMonth(lastMonth), DATE_KEY_FORMAT),
        end: format(endOfMonth(lastMonth), DATE_KEY_FORMAT),
      }
    }
    case "this-year":
      return {
        start: format(startOfYear(zoned), DATE_KEY_FORMAT),
        end: format(endOfYear(zoned), DATE_KEY_FORMAT),
      }
    case "last-year": {
      const lastYear = subYears(zoned, 1)
      return {
        start: format(startOfYear(lastYear), DATE_KEY_FORMAT),
        end: format(endOfYear(lastYear), DATE_KEY_FORMAT),
      }
    }
  }
}
