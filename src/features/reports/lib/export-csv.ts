export type CsvColumn = { key: string; header: string }

// Builds a CSV string (CRLF line endings, per RFC 4180) from plain rows and a
// column list — no library, this is small enough to hand-roll and every other
// report-shaped query in the codebase already lets the frontend shape rows
// itself (see aggregate.ts).
export function buildCsv(
  rows: Record<string, string | number>[],
  columns: CsvColumn[]
): string {
  const lines = [columns.map((column) => escapeCsvValue(column.header)).join(",")]
  for (const row of rows) {
    lines.push(columns.map((column) => escapeCsvValue(row[column.key])).join(","))
  }
  return lines.join("\r\n")
}

function escapeCsvValue(value: string | number | undefined): string {
  const stringValue = value === undefined ? "" : String(value)
  if (/[",\r\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

// Triggers a browser download of `csv` as `filename` via a temporary,
// never-attached-to-the-DOM-for-long <a download> element.
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
