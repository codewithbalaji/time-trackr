import { TZDate } from "@date-fns/tz"
import { addDays, format } from "date-fns"

const DATE_KEY_FORMAT = "yyyy-MM-dd"

// Monday–Sunday, matching the reference screenshot and the `timesheets`
// table's period_start/period_end convention — computed against the
// organization's timezone (organizations.timezone) so every member sees the
// same week regardless of their own browser locale.
export function getWeekStart(date: Date, timezone: string): string {
  const zoned = new TZDate(date, timezone)
  const isoDayOfWeek = (zoned.getDay() + 6) % 7 // Mon=0 ... Sun=6
  return format(addDays(zoned, -isoDayOfWeek), DATE_KEY_FORMAT)
}

export function shiftWeek(periodStart: string, weeks: number): string {
  return format(addDays(parseDateKey(periodStart), weeks * 7), DATE_KEY_FORMAT)
}

export function getWeekDays(periodStart: string): Date[] {
  const start = parseDateKey(periodStart)
  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
}

export function formatWeekRange(periodStart: string): string {
  const days = getWeekDays(periodStart)
  const first = days[0]
  const last = days[6]
  const sameMonth = first.getMonth() === last.getMonth()
  return `${format(first, "MMM d")} – ${format(last, sameMonth ? "d, yyyy" : "MMM d, yyyy")}`
}

// The calendar date (in the organization's timezone) a UTC timestamp falls
// on — used to bucket time entries into the daily/weekly grid, matching how
// period_start/period_end are interpreted at the database level (see
// is_time_entry_period_locked() in the Phase 7 migration).
export function getEntryDateKey(isoTimestamp: string, timezone: string): string {
  return format(new TZDate(new Date(isoTimestamp), timezone), DATE_KEY_FORMAT)
}

// UTC instant bounds ([start, end)) for querying time_entries.start_time,
// derived from a plain calendar period_start/timezone pair. Normalized to a
// plain "Z"-suffixed ISO string (matching every other timestamp in the
// codebase) rather than TZDate#toISOString()'s explicit-offset format — both
// represent the same instant, but this keeps the representation consistent.
export function getPeriodUtcBounds(
  periodStart: string,
  timezone: string
): { startIso: string; endIso: string } {
  const [year, month, day] = periodStart.split("-").map(Number)
  const start = new TZDate(year, month - 1, day, timezone)
  return {
    startIso: new Date(start.getTime()).toISOString(),
    endIso: new Date(addDays(start, 7).getTime()).toISOString(),
  }
}

function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`)
}
