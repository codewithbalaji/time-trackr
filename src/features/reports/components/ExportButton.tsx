import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { buildCsv, downloadCsv, type CsvColumn } from "@/features/reports/lib/export-csv"
import { formatDuration } from "@/features/time-tracking/lib/format-duration"
import type { DescriptionTotal, ProjectTotal } from "@/features/reports/lib/aggregate"
import type { DateRange } from "@/features/reports/lib/date-range-presets"
import type { ReportEntry } from "@/features/reports/services/report.service"

type ExportSource =
  | { kind: "summary"; groupBy: "project" | "description"; rows: ProjectTotal[] | DescriptionTotal[] }
  | { kind: "detailed"; entries: ReportEntry[]; showMember: boolean }

// Exports whichever tab is active on ReportsPage — Summary's grouped rows or
// Detailed's flat rows — as a client-side generated CSV (see lib/export-csv.ts).
export function ExportButton({ source, range }: { source: ExportSource; range: DateRange }) {
  function handleExport() {
    const csv = source.kind === "summary" ? buildSummaryCsv(source) : buildDetailedCsv(source)
    downloadCsv(`time-report_${range.start}_to_${range.end}.csv`, csv)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="size-4" data-icon="inline-start" />
      Export CSV
    </Button>
  )
}

function buildSummaryCsv(source: Extract<ExportSource, { kind: "summary" }>): string {
  const groupHeader = source.groupBy === "project" ? "Project" : "Description"
  const rows =
    source.groupBy === "project"
      ? (source.rows as ProjectTotal[]).map((row) => ({
          group: row.projectName,
          duration: formatDuration(row.totalSeconds),
        }))
      : (source.rows as DescriptionTotal[]).map((row) => ({
          group: row.description,
          duration: formatDuration(row.totalSeconds),
        }))
  const columns: CsvColumn[] = [
    { key: "group", header: groupHeader },
    { key: "duration", header: "Duration" },
  ]
  return buildCsv(rows, columns)
}

function buildDetailedCsv(source: Extract<ExportSource, { kind: "detailed" }>): string {
  const rows = source.entries.map((entry) => ({
    date: entry.start_time.slice(0, 10),
    member: entry.user.full_name ?? entry.user.email,
    project: entry.project.name,
    description: entry.description,
    duration: formatDuration(entry.duration_seconds ?? 0),
  }))
  const columns: CsvColumn[] = [
    { key: "date", header: "Date" },
    ...(source.showMember ? [{ key: "member", header: "Member" }] : []),
    { key: "project", header: "Project" },
    { key: "description", header: "Description" },
    { key: "duration", header: "Duration" },
  ]
  return buildCsv(rows, columns)
}
