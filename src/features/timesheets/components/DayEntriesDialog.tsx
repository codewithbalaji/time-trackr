import { format } from "date-fns"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { TimeEntry } from "@/features/time-tracking/services/time-entry.service"
import { TimeEntryRow } from "@/features/time-tracking/components/TimeEntryRow"
import { ManualEntryForm } from "@/features/time-tracking/components/ManualEntryForm"
import { useStartTimer } from "@/features/time-tracking/hooks/useStartTimer"
import {
  formatOrgDayHeading,
  type DateFormat,
  type TimeFormat,
} from "@/features/organizations/lib/date-time-format"

export function DayEntriesDialog({
  open,
  onOpenChange,
  date,
  projectId,
  projectName,
  entries,
  organizationId,
  userId,
  locked,
  dateFormat,
  timeFormat,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date
  projectId: string
  projectName: string
  entries: TimeEntry[]
  organizationId: string
  userId: string
  locked: boolean
  dateFormat: DateFormat
  timeFormat: TimeFormat
}) {
  const startTimer = useStartTimer(organizationId, userId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {projectName} · {formatOrgDayHeading(date, dateFormat)}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet.</p>
          ) : (
            entries.map((entry) => (
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
            ))
          )}
        </div>
        {!locked && (
          <div className="mt-2 border-t border-border pt-4">
            <ManualEntryForm
              organizationId={organizationId}
              userId={userId}
              initialProjectId={projectId}
              initialDate={format(date, "yyyy-MM-dd")}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
