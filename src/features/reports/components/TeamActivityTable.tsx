import { format } from "date-fns"
import { Loader2, Users } from "lucide-react"

import { formatDuration } from "@/features/time-tracking/lib/format-duration"
import type { ReportEntry } from "@/features/reports/services/report.service"

type MemberActivity = {
  userId: string
  name: string
  latestActivity: string
  totalSeconds: number
}

// Dashboard's team table — only rendered when the caller has already
// confirmed timesheets.approve (see DashboardPage). Grouped client-side from
// the same org-wide entries useOrgReportEntries already fetched, no extra
// query.
export function TeamActivityTable({
  entries,
  isLoading,
}: {
  entries: ReportEntry[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading team activity...
      </div>
    )
  }

  const rows = groupByMember(entries)

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
          <Users className="size-5 text-accent-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">No team activity yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Time tracked by your team in this range will show up here.
          </p>
        </div>
      </div>
    )
  }

  const maxSeconds = Math.max(...rows.map((row) => row.totalSeconds))

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.userId} className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{row.name}</p>
            <p className="text-sm text-muted-foreground">
              Last tracked {format(new Date(row.latestActivity), "MMM d, h:mm a")}
            </p>
          </div>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${maxSeconds > 0 ? (row.totalSeconds / maxSeconds) * 100 : 0}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right font-mono text-sm tabular-nums">
            {formatDuration(row.totalSeconds)}
          </span>
        </div>
      ))}
    </div>
  )
}

function groupByMember(entries: ReportEntry[]): MemberActivity[] {
  const byUser = new Map<string, MemberActivity>()
  for (const entry of entries) {
    const seconds = entry.duration_seconds ?? 0
    const existing = byUser.get(entry.user_id)
    if (existing) {
      existing.totalSeconds += seconds
      if (entry.start_time > existing.latestActivity) existing.latestActivity = entry.start_time
    } else {
      byUser.set(entry.user_id, {
        userId: entry.user_id,
        name: entry.user.full_name ?? entry.user.email,
        latestActivity: entry.start_time,
        totalSeconds: seconds,
      })
    }
  }
  return [...byUser.values()].sort((a, b) => b.totalSeconds - a.totalSeconds)
}
