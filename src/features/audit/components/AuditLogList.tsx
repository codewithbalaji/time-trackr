import { Loader2, ScrollText } from "lucide-react"

import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AuditLogRow } from "@/features/audit/components/AuditLogRow"
import type { AuditLogEntry } from "@/features/audit/services/audit.service"

export function AuditLogList({
  entries,
  isLoading,
}: {
  entries: AuditLogEntry[] | undefined
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading...
      </div>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
          <ScrollText className="size-5 text-accent-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">No activity yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Actions like settings changes, membership updates, and project edits will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Actor</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Resource</TableHead>
          <TableHead className="text-right">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <AuditLogRow key={entry.id} entry={entry} />
        ))}
      </TableBody>
    </Table>
  )
}
