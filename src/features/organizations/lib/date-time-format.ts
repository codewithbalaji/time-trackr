import { format } from "date-fns"

// Kept in sync with the `date_format`/`time_format` CHECK constraints in
// supabase/migrations/20260908090000_phase7_time_settings.sql.
export const DATE_FORMAT_VALUES = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"] as const
export type DateFormat = (typeof DATE_FORMAT_VALUES)[number]

export const TIME_FORMAT_VALUES = ["12h", "24h"] as const
export type TimeFormat = (typeof TIME_FORMAT_VALUES)[number]

const NUMERIC_DATE_PATTERNS: Record<DateFormat, string> = {
  "MM/DD/YYYY": "MM/dd/yyyy",
  "DD/MM/YYYY": "dd/MM/yyyy",
  "YYYY-MM-DD": "yyyy-MM-dd",
}

// Weekday-name headers ("Monday, Aug 24") reorder month/day to match the
// organization's day-first vs month-first convention, used by Time
// Tracker's and Timesheets' day groupings. The year is omitted (as with the
// existing headers), so YYYY-MM-DD's day-first ordering mirrors DD/MM/YYYY.
const DAY_HEADING_PATTERNS: Record<DateFormat, string> = {
  "MM/DD/YYYY": "EEEE, MMM d",
  "DD/MM/YYYY": "EEEE, d MMM",
  "YYYY-MM-DD": "EEEE, d MMM",
}

const TIME_PATTERNS: Record<TimeFormat, string> = {
  "12h": "h:mm a",
  "24h": "HH:mm",
}

// A plain numeric date, e.g. for a future Reports/export table — no current
// screen shows a raw numeric date yet, but the mapping is here so Reports
// (Phase 9) can reuse it instead of inventing its own.
export function formatOrgDate(date: Date, dateFormat: DateFormat): string {
  return format(date, NUMERIC_DATE_PATTERNS[dateFormat])
}

export function formatOrgDayHeading(date: Date, dateFormat: DateFormat): string {
  return format(date, DAY_HEADING_PATTERNS[dateFormat])
}

export function formatOrgTime(date: Date, timeFormat: TimeFormat): string {
  return format(date, TIME_PATTERNS[timeFormat])
}
