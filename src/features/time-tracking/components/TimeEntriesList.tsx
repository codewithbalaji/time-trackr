import { Clock, Loader2 } from "lucide-react"
import { format, isSameDay } from "date-fns"

import type { TimeEntry } from "@/features/time-tracking/services/time-entry.service"
import { TimeEntryRow } from "@/features/time-tracking/components/TimeEntryRow"
import { formatDuration } from "@/features/time-tracking/lib/format-duration"

type DayGroup = {
  dateKey: string
  date: Date
  totalSeconds: number
  entries: TimeEntry[]
}

export function TimeEntriesList({
  entries,
  isLoading,
  organizationId,
  userId,
  onRestart,
}: {
  entries: TimeEntry[]
  isLoading: boolean
  organizationId: string
  userId: string
  onRestart: (entry: TimeEntry) => void
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading time entries...
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
          <Clock className="size-5 text-accent-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">No time entries yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Start the timer above or add a manual entry to begin tracking time.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {groupByDay(entries).map((group) => (
        <div key={group.dateKey}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">{format(group.date, "EEEE, MMM d")}</span>
            <span className="text-muted-foreground">{formatDuration(group.totalSeconds)}</span>
          </div>
          <div className="flex flex-col gap-2">
            {group.entries.map((entry) => (
              <TimeEntryRow
                key={entry.id}
                entry={entry}
                organizationId={organizationId}
                userId={userId}
                onRestart={() => onRestart(entry)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Entries arrive ordered by start_time desc; grouping preserves that order
// (most recent day first) as long as we don't re-sort.
function groupByDay(entries: TimeEntry[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const entry of entries) {
    const date = new Date(entry.start_time)
    const existing = groups.find((group) => isSameDay(group.date, date))
    if (existing) {
      existing.entries.push(entry)
      existing.totalSeconds += entry.duration_seconds ?? 0
    } else {
      groups.push({
        dateKey: date.toDateString(),
        date,
        totalSeconds: entry.duration_seconds ?? 0,
        entries: [entry],
      })
    }
  }
  return groups
}
