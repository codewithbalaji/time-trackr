import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SummaryTable } from "@/features/reports/components/SummaryTable"
import type { DescriptionTotal, ProjectTotal } from "@/features/reports/lib/aggregate"

const PROJECT_ROWS: ProjectTotal[] = [
  { projectId: "proj-1", projectName: "Website", color: "#3366ff", totalSeconds: 5400 },
  { projectId: "proj-2", projectName: "Internal", color: "#000000", totalSeconds: 1800 },
]

const DESCRIPTION_ROWS: DescriptionTotal[] = [{ description: "Writing docs", totalSeconds: 3600 }]

describe("SummaryTable", () => {
  it("shows a loading state", () => {
    render(<SummaryTable rows={[]} isLoading groupBy="project" />)
    expect(screen.getByText(/loading summary/i)).toBeInTheDocument()
  })

  it("shows an empty state when there are no rows", () => {
    render(<SummaryTable rows={[]} isLoading={false} groupBy="project" />)
    expect(screen.getByText(/no entries in this range/i)).toBeInTheDocument()
  })

  it("renders project rows with duration", () => {
    render(<SummaryTable rows={PROJECT_ROWS} isLoading={false} groupBy="project" />)
    expect(screen.getByText("Website")).toBeInTheDocument()
    expect(screen.getByText("01:30:00")).toBeInTheDocument()
    expect(screen.getByText("Internal")).toBeInTheDocument()
    expect(screen.getByText("00:30:00")).toBeInTheDocument()
  })

  it("renders description rows when grouped by description", () => {
    render(<SummaryTable rows={DESCRIPTION_ROWS} isLoading={false} groupBy="description" />)
    expect(screen.getByText("Writing docs")).toBeInTheDocument()
    expect(screen.getByText("01:00:00")).toBeInTheDocument()
  })
})
