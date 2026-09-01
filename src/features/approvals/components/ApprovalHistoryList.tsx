import { format } from "date-fns"
import { Loader2 } from "lucide-react"

import { useTimesheetHistory } from "@/features/approvals/hooks/useTimesheetHistory"

const STATUS_LABELS: Record<string, string> = {
  draft: "Set to draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
}

export function ApprovalHistoryList({ timesheetId }: { timesheetId: string }) {
  const { data: history, isLoading } = useTimesheetHistory(timesheetId)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading history...
      </div>
    )
  }

  if (!history || history.length === 0) {
    return null
  }

  return (
    <ul className="flex flex-col gap-3">
      {history.map((entry) => (
        <li key={entry.id} className="flex flex-col gap-0.5 border-l-2 border-border pl-3">
          <p className="text-sm font-medium">
            {entry.status ? (STATUS_LABELS[entry.status] ?? entry.status) : "Updated"}
          </p>
          <p className="text-sm text-muted-foreground">
            {entry.actor?.full_name ?? entry.actor?.email ?? "Unknown"} ·{" "}
            {format(new Date(entry.created_at), "MMM d, yyyy h:mm a")}
          </p>
          {entry.rejection_reason && (
            <p className="mt-1 text-sm text-muted-foreground">"{entry.rejection_reason}"</p>
          )}
        </li>
      ))}
    </ul>
  )
}
