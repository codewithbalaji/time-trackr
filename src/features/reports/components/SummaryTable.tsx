import { Loader2, Table2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDuration } from "@/features/time-tracking/lib/format-duration"
import type { DescriptionTotal, ProjectTotal } from "@/features/reports/lib/aggregate"

type SummaryRow = { key: string; label: string; totalSeconds: number; color?: string }

export function SummaryTable({
  rows,
  isLoading,
  groupBy,
}: {
  rows: ProjectTotal[] | DescriptionTotal[]
  isLoading: boolean
  groupBy: "project" | "description"
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading summary...
      </div>
    )
  }

  const normalized = normalizeRows(rows, groupBy)

  if (normalized.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
          <Table2 className="size-5 text-accent-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">No entries in this range</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Adjust the filters above or pick a different date range.
          </p>
        </div>
      </div>
    )
  }

  const grandTotal = normalized.reduce((sum, row) => sum + row.totalSeconds, 0)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{groupBy === "project" ? "Project" : "Description"}</TableHead>
          <TableHead className="text-right">Duration</TableHead>
          <TableHead className="w-40">Share</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {normalized.map((row) => (
          <TableRow key={row.key}>
            <TableCell className="font-medium">
              <span className="flex items-center gap-2">
                {row.color && (
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                    aria-hidden="true"
                  />
                )}
                {row.label}
              </span>
            </TableCell>
            <TableCell className="text-right font-mono text-sm tabular-nums">
              {formatDuration(row.totalSeconds)}
            </TableCell>
            <TableCell>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${grandTotal > 0 ? (row.totalSeconds / grandTotal) * 100 : 0}%` }}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function normalizeRows(
  rows: ProjectTotal[] | DescriptionTotal[],
  groupBy: "project" | "description"
): SummaryRow[] {
  if (groupBy === "project") {
    return (rows as ProjectTotal[]).map((row) => ({
      key: row.projectId,
      label: row.projectName,
      totalSeconds: row.totalSeconds,
      color: row.color,
    }))
  }
  return (rows as DescriptionTotal[]).map((row) => ({
    key: row.description,
    label: row.description,
    totalSeconds: row.totalSeconds,
  }))
}
