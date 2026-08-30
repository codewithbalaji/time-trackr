import { useState } from "react"
import { MoreHorizontal, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { TimeEntry } from "@/features/time-tracking/services/time-entry.service"
import { useDeleteTimeEntry } from "@/features/time-tracking/hooks/useDeleteTimeEntry"
import { EditTimeEntryDialog } from "@/features/time-tracking/components/EditTimeEntryDialog"
import { formatDuration } from "@/features/time-tracking/lib/format-duration"
import { formatOrgTime, type TimeFormat } from "@/features/organizations/lib/date-time-format"

export function TimeEntryRow({
  entry,
  organizationId,
  userId,
  onRestart,
  timeFormat,
  locked = false,
}: {
  entry: TimeEntry
  organizationId: string
  userId: string
  onRestart: () => void
  timeFormat: TimeFormat
  // True once this entry's week has been submitted (see the Timesheets
  // feature) — hides the actions the database's lock trigger would reject
  // anyway, rather than letting them fail with a toast.
  locked?: boolean
}) {
  const deleteEntry = useDeleteTimeEntry(organizationId, userId)
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: entry.project.color }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{entry.description}</p>
        <p className="truncate text-xs text-muted-foreground">{entry.project.name}</p>
      </div>
      <span className="hidden shrink-0 text-sm text-muted-foreground sm:inline">
        {formatOrgTime(new Date(entry.start_time), timeFormat)}
        {" – "}
        {entry.end_time ? formatOrgTime(new Date(entry.end_time), timeFormat) : "—"}
      </span>
      <span className="w-20 shrink-0 text-right font-mono text-sm tabular-nums">
        {formatDuration(entry.duration_seconds ?? 0)}
      </span>
      {!locked && (
        <>
          <Button variant="ghost" size="icon-sm" aria-label="Restart timer" onClick={onRestart}>
            <Play className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Entry actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)}>Edit</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmingDelete(true)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

      <EditTimeEntryDialog
        entry={editing ? entry : null}
        organizationId={organizationId}
        userId={userId}
        onOpenChange={setEditing}
      />

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete time entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{entry.description}". This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteEntry.mutate(entry.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
