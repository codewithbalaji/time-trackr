import { Fragment, useState } from "react"
import { format } from "date-fns"
import { ClipboardCheck, Loader2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePendingTimesheets } from "@/features/approvals/hooks/usePendingTimesheets"
import { ApproveTimesheetButton } from "@/features/approvals/components/ApproveTimesheetButton"
import { RejectTimesheetDialog } from "@/features/approvals/components/RejectTimesheetDialog"
import { WeeklyTimesheetGrid } from "@/features/timesheets/components/WeeklyTimesheetGrid"
import { useTimeEntriesForPeriod } from "@/features/timesheets/hooks/useTimeEntriesForPeriod"
import { formatWeekRange } from "@/features/timesheets/lib/week"

export function ReviewQueueTable({
  organizationId,
  timezone,
}: {
  organizationId: string
  timezone: string
}) {
  const { data: pending, isLoading } = usePendingTimesheets(organizationId)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading review queue...
      </div>
    )
  }

  if (!pending || pending.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
          <ClipboardCheck className="size-5 text-accent-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Nothing to review</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Submitted timesheets awaiting approval will show up here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Week</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="w-56" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {pending.map((timesheet) => (
          <Fragment key={timesheet.id}>
            <TableRow>
              <TableCell className="font-medium">
                {timesheet.user.full_name ?? timesheet.user.email}
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  className="text-left text-primary hover:underline"
                  onClick={() =>
                    setExpandedId(expandedId === timesheet.id ? null : timesheet.id)
                  }
                >
                  {formatWeekRange(timesheet.period_start)}
                </button>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(timesheet.submitted_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <ApproveTimesheetButton
                    organizationId={organizationId}
                    userId={timesheet.user.id}
                    periodStart={timesheet.period_start}
                  />
                  <RejectTimesheetDialog
                    organizationId={organizationId}
                    userId={timesheet.user.id}
                    periodStart={timesheet.period_start}
                  />
                </div>
              </TableCell>
            </TableRow>
            {expandedId === timesheet.id && (
              <TableRow>
                <TableCell colSpan={4} className="bg-muted/40">
                  <TimesheetDrilldown
                    organizationId={organizationId}
                    userId={timesheet.user.id}
                    periodStart={timesheet.period_start}
                    timezone={timezone}
                  />
                </TableCell>
              </TableRow>
            )}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  )
}

function TimesheetDrilldown({
  organizationId,
  userId,
  periodStart,
  timezone,
}: {
  organizationId: string
  userId: string
  periodStart: string
  timezone: string
}) {
  const { data: entries, isLoading } = useTimeEntriesForPeriod(
    organizationId,
    userId,
    periodStart,
    timezone
  )

  return (
    <div className="py-2">
      <WeeklyTimesheetGrid
        entries={entries ?? []}
        isLoading={isLoading}
        periodStart={periodStart}
        timezone={timezone}
        onSelectCell={() => {
          // Read-only in the review queue — reviewers can view but not edit
          // another member's entries.
        }}
      />
      <p className="mt-2 text-sm text-muted-foreground">
        Only the timesheet owner can edit these entries.
      </p>
    </div>
  )
}
