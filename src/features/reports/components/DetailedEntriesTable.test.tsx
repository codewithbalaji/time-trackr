import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { DetailedEntriesTable } from "@/features/reports/components/DetailedEntriesTable"
import type { ReportEntry } from "@/features/reports/services/report.service"

const ENTRIES: ReportEntry[] = [
  {
    id: "entry-1",
    user_id: "user-1",
    description: "Writing docs",
    start_time: "2026-08-24T10:00:00.000Z",
    end_time: "2026-08-24T11:00:00.000Z",
    duration_seconds: 3600,
    created_at: "2026-08-24T10:00:00.000Z",
    project: { id: "proj-1", name: "Website", color: "#3366ff", client: null },
    user: { id: "user-1", full_name: "Ana Reviewer", email: "ana@example.com" },
  },
  {
    id: "entry-2",
    user_id: "user-2",
    description: "Bug fixes",
    start_time: "2026-08-25T10:00:00.000Z",
    end_time: "2026-08-25T10:30:00.000Z",
    duration_seconds: 1800,
    created_at: "2026-08-25T10:00:00.000Z",
    project: { id: "proj-2", name: "Internal", color: "#000000", client: null },
    user: { id: "user-2", full_name: null, email: "sam@example.com" },
  },
]

describe("DetailedEntriesTable", () => {
  it("shows a loading state", () => {
    render(<DetailedEntriesTable entries={[]} isLoading showMember timezone="UTC" />)
    expect(screen.getByText(/loading entries/i)).toBeInTheDocument()
  })

  it("shows an empty state when there are no entries", () => {
    render(<DetailedEntriesTable entries={[]} isLoading={false} showMember timezone="UTC" />)
    expect(screen.getByText(/no entries in this range/i)).toBeInTheDocument()
  })

  it("renders one row per entry, falling back to email when full_name is null", () => {
    render(<DetailedEntriesTable entries={ENTRIES} isLoading={false} showMember timezone="UTC" />)
    expect(screen.getByText("Ana Reviewer")).toBeInTheDocument()
    expect(screen.getByText("sam@example.com")).toBeInTheDocument()
    expect(screen.getByText("Website")).toBeInTheDocument()
    expect(screen.getByText("Internal")).toBeInTheDocument()
  })

  it("hides the Member column when showMember is false", () => {
    render(<DetailedEntriesTable entries={ENTRIES} isLoading={false} showMember={false} timezone="UTC" />)
    expect(screen.queryByText("Ana Reviewer")).not.toBeInTheDocument()
    expect(screen.queryByRole("columnheader", { name: /member/i })).not.toBeInTheDocument()
  })

  it("sorts by duration when the Duration header is clicked", async () => {
    const user = userEvent.setup()
    render(<DetailedEntriesTable entries={ENTRIES} isLoading={false} showMember timezone="UTC" />)

    await user.click(screen.getByRole("button", { name: /duration/i }))

    const rows = screen.getAllByRole("row").slice(1) // skip header row
    expect(within(rows[0]!).getByText("Internal")).toBeInTheDocument() // ascending: 00:30:00 first
  })
})
