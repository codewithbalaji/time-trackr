import { useState } from "react"
import { format } from "date-fns"
import { ArrowDown, ArrowUp, ListChecks, Loader2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatDuration } from "@/features/time-tracking/lib/format-duration"
import { getEntryDateKey } from "@/features/timesheets/lib/week"
import type { ReportEntry } from "@/features/reports/services/report.service"

type SortColumn = "date" | "member" | "project" | "duration"
type SortDirection = "asc" | "desc"

// Flat entry rows, hand-built with the same shadcn table primitives as
// ReviewQueueTable/ClientsTable/ProjectsTable (not @tanstack/react-table —
// see the Phase 9 plan). `showMember` hides the Member column when the page
// is scoped to "only me".
export function DetailedEntriesTable({
  entries,
  isLoading,
  showMember,
  timezone,
}: {
  entries: ReportEntry[]
  isLoading: boolean
  showMember: boolean
  timezone: string
}) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading entries...
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
          <ListChecks className="size-5 text-accent-foreground" />
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

  function toggleSort(column: SortColumn) {
    if (column === sortColumn) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const sorted = sortEntries(entries, sortColumn, sortDirection)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead
            column="date"
            label="Date"
            active={sortColumn === "date"}
            direction={sortDirection}
            onClick={toggleSort}
          />
          {showMember && (
            <SortableHead
              column="member"
              label="Member"
              active={sortColumn === "member"}
              direction={sortDirection}
              onClick={toggleSort}
            />
          )}
          <SortableHead
            column="project"
            label="Project"
            active={sortColumn === "project"}
            direction={sortDirection}
            onClick={toggleSort}
          />
          <TableHead>Description</TableHead>
          <SortableHead
            column="duration"
            label="Duration"
            active={sortColumn === "duration"}
            direction={sortDirection}
            onClick={toggleSort}
            align="right"
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="text-muted-foreground">
              {format(parseDateKey(getEntryDateKey(entry.start_time, timezone)), "MMM d, yyyy")}
            </TableCell>
            {showMember && <TableCell>{entry.user.full_name ?? entry.user.email}</TableCell>}
            <TableCell>
              <span className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.project.color }}
                  aria-hidden="true"
                />
                {entry.project.name}
              </span>
            </TableCell>
            <TableCell className="max-w-xs truncate text-muted-foreground">
              {entry.description || "—"}
            </TableCell>
            <TableCell className="text-right font-mono text-sm tabular-nums">
              {formatDuration(entry.duration_seconds ?? 0)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function SortableHead({
  column,
  label,
  active,
  direction,
  onClick,
  align,
}: {
  column: SortColumn
  label: string
  active: boolean
  direction: SortDirection
  onClick: (column: SortColumn) => void
  align?: "right"
}) {
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          align === "right" && "flex-row-reverse"
        )}
        onClick={() => onClick(column)}
      >
        {label}
        {active &&
          (direction === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          ))}
      </button>
    </TableHead>
  )
}

function sortEntries(
  entries: ReportEntry[],
  column: SortColumn,
  direction: SortDirection
): ReportEntry[] {
  const factor = direction === "asc" ? 1 : -1
  return [...entries].sort((a, b) => {
    switch (column) {
      case "date":
        return factor * a.start_time.localeCompare(b.start_time)
      case "member":
        return factor * memberLabel(a).localeCompare(memberLabel(b))
      case "project":
        return factor * a.project.name.localeCompare(b.project.name)
      case "duration":
        return factor * ((a.duration_seconds ?? 0) - (b.duration_seconds ?? 0))
    }
  })
}

function memberLabel(entry: ReportEntry): string {
  return entry.user.full_name ?? entry.user.email
}

function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`)
}
