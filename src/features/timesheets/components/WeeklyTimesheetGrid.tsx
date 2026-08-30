import { Loader2 } from "lucide-react"
import { format } from "date-fns"

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { TimeEntry } from "@/features/time-tracking/services/time-entry.service"
import { formatDuration } from "@/features/time-tracking/lib/format-duration"
import { getEntryDateKey, getWeekDays } from "@/features/timesheets/lib/week"
import { TimesheetDayCell } from "@/features/timesheets/components/TimesheetDayCell"

type DayBucket = { entries: TimeEntry[]; totalSeconds: number }
type ProjectRow = {
  project: { id: string; name: string; color: string }
  totalSeconds: number
  byDay: Record<string, DayBucket>
}

// Read-only summary of time already tracked (via Time Tracker/Phase 6),
// grouped by project row and day column, mirroring the reference
// screenshot's layout. Clicking a cell opens a dialog to add/edit/delete
// entries for that project+day — there's no second, duration-only way to
// record time, see the Phase 7 plan.
export function WeeklyTimesheetGrid({
  entries,
  isLoading,
  periodStart,
  timezone,
  onSelectCell,
}: {
  entries: TimeEntry[]
  isLoading: boolean
  periodStart: string
  timezone: string
  onSelectCell: (project: { id: string; name: string }, date: Date) => void
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading timesheet...
      </div>
    )
  }

  const days = getWeekDays(periodStart)
  const dayKeys = days.map((day) => format(day, "yyyy-MM-dd"))
  const rows = groupByProjectAndDay(entries, timezone)

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
        <p className="text-sm font-medium">No time tracked this week</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Track time on the Time Tracker page, then come back here to review and submit it.
        </p>
      </div>
    )
  }

  const dayTotals = dayKeys.map((key) =>
    rows.reduce((sum, row) => sum + (row.byDay[key]?.totalSeconds ?? 0), 0)
  )
  const grandTotal = rows.reduce((sum, row) => sum + row.totalSeconds, 0)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          {days.map((day) => (
            <TableHead key={day.toISOString()} className="text-right">
              {format(day, "EEE d")}
            </TableHead>
          ))}
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.project.id}>
            <TableCell>
              <span className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: row.project.color }}
                  aria-hidden="true"
                />
                {row.project.name}
              </span>
            </TableCell>
            {days.map((day, index) => {
              const bucket = row.byDay[dayKeys[index]]
              return (
                <TimesheetDayCell
                  key={dayKeys[index]}
                  seconds={bucket?.totalSeconds ?? 0}
                  onClick={() => onSelectCell(row.project, day)}
                />
              )
            })}
            <TableCell className="text-right font-mono text-sm tabular-nums">
              {formatDuration(row.totalSeconds)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          {dayTotals.map((seconds, index) => (
            <TableCell
              key={dayKeys[index]}
              className="text-right font-mono text-sm tabular-nums"
            >
              {formatDuration(seconds)}
            </TableCell>
          ))}
          <TableCell className="text-right font-mono text-sm tabular-nums">
            {formatDuration(grandTotal)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

function groupByProjectAndDay(entries: TimeEntry[], timezone: string): ProjectRow[] {
  const rows = new Map<string, ProjectRow>()
  for (const entry of entries) {
    if (!entry.end_time) continue // a running entry has no final duration yet
    let row = rows.get(entry.project.id)
    if (!row) {
      row = { project: entry.project, totalSeconds: 0, byDay: {} }
      rows.set(entry.project.id, row)
    }
    const dayKey = getEntryDateKey(entry.start_time, timezone)
    const bucket = row.byDay[dayKey] ?? { entries: [], totalSeconds: 0 }
    bucket.entries.push(entry)
    bucket.totalSeconds += entry.duration_seconds ?? 0
    row.byDay[dayKey] = bucket
    row.totalSeconds += entry.duration_seconds ?? 0
  }
  return [...rows.values()].sort((a, b) => a.project.name.localeCompare(b.project.name))
}
