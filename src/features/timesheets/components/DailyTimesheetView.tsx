import { format } from "date-fns"
import { Clock } from "lucide-react"

import type { TimeEntry } from "@/features/time-tracking/services/time-entry.service"
import { TimeEntryRow } from "@/features/time-tracking/components/TimeEntryRow"
import { useStartTimer } from "@/features/time-tracking/hooks/useStartTimer"
import { formatDuration } from "@/features/time-tracking/lib/format-duration"
import { getEntryDateKey } from "@/features/timesheets/lib/week"
import {
  formatOrgDayHeading,
  type DateFormat,
  type TimeFormat,
} from "@/features/organizations/lib/date-time-format"

export function DailyTimesheetView({
  entries,
  date,
  timezone,
  organizationId,
  userId,
  locked,
  dateFormat,
  timeFormat,
}: {
  entries: TimeEntry[]
  date: Date
  timezone: string
  organizationId: string
  userId: string
  locked: boolean
  dateFormat: DateFormat
  timeFormat: TimeFormat
}) {
  const startTimer = useStartTimer(organizationId, userId)
  const dateKey = format(date, "yyyy-MM-dd")
  const dayEntries = entries.filter(
    (entry) => getEntryDateKey(entry.start_time, timezone) === dateKey
  )
  const totalSeconds = dayEntries.reduce((sum, entry) => sum + (entry.duration_seconds ?? 0), 0)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium">{formatOrgDayHeading(date, dateFormat)}</span>
        <span className="text-muted-foreground">{formatDuration(totalSeconds)}</span>
      </div>
      {dayEntries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
            <Clock className="size-5 text-accent-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No time tracked on this day.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {dayEntries.map((entry) => (
            <TimeEntryRow
              key={entry.id}
              entry={entry}
              organizationId={organizationId}
              userId={userId}
              locked={locked}
              timeFormat={timeFormat}
              onRestart={() =>
                startTimer.mutate({
                  organizationId,
                  projectId: entry.project.id,
                  description: entry.description,
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
