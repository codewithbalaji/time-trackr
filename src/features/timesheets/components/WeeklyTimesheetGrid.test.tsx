import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { format } from "date-fns"
import { describe, expect, it, vi } from "vitest"

import { WeeklyTimesheetGrid } from "@/features/timesheets/components/WeeklyTimesheetGrid"
import type { TimeEntry } from "@/features/time-tracking/services/time-entry.service"

const PROJECT_A = { id: "project-a", name: "Website Redesign", color: "#3B82F6" }
const PROJECT_B = { id: "project-b", name: "Mobile App", color: "#22C55E" }

function entry(overrides: Partial<TimeEntry>): TimeEntry {
  return {
    id: "entry",
    description: "Work",
    start_time: "2026-08-24T09:00:00.000Z",
    end_time: "2026-08-24T10:00:00.000Z",
    duration_seconds: 3600,
    created_at: "2026-08-24T09:00:00.000Z",
    project: PROJECT_A,
    ...overrides,
  }
}

const ENTRIES: TimeEntry[] = [
  entry({ id: "1", project: PROJECT_A, start_time: "2026-08-24T09:00:00.000Z", duration_seconds: 3600 }), // Mon, 1h
  entry({
    id: "2",
    project: PROJECT_A,
    start_time: "2026-08-25T09:00:00.000Z",
    end_time: "2026-08-25T09:30:00.000Z",
    duration_seconds: 1800,
  }), // Tue, 30m
  entry({ id: "3", project: PROJECT_B, start_time: "2026-08-24T10:00:00.000Z", duration_seconds: 7200 }), // Mon, 2h
  entry({
    id: "4",
    project: PROJECT_A,
    start_time: "2026-08-24T12:00:00.000Z",
    end_time: null,
    duration_seconds: null,
  }), // still running -- must not count
]

describe("WeeklyTimesheetGrid", () => {
  it("shows the loading state", () => {
    render(
      <WeeklyTimesheetGrid
        entries={[]}
        isLoading
        periodStart="2026-08-24"
        timezone="UTC"
        onSelectCell={vi.fn()}
      />
    )
    expect(screen.getByText(/loading timesheet/i)).toBeInTheDocument()
  })

  it("shows the empty state when nothing was tracked", () => {
    render(
      <WeeklyTimesheetGrid
        entries={[]}
        isLoading={false}
        periodStart="2026-08-24"
        timezone="UTC"
        onSelectCell={vi.fn()}
      />
    )
    expect(screen.getByText("No time tracked this week")).toBeInTheDocument()
  })

  it("groups entries by project and day, excluding the running entry from totals", () => {
    render(
      <WeeklyTimesheetGrid
        entries={ENTRIES}
        isLoading={false}
        periodStart="2026-08-24"
        timezone="UTC"
        onSelectCell={vi.fn()}
      />
    )

    expect(screen.getByText("Website Redesign")).toBeInTheDocument()
    expect(screen.getByText("Mobile App")).toBeInTheDocument()

    // Row totals: Website Redesign = 1h + 30m = 1h30m; Mobile App's row total
    // and its Monday cell are both 2h, hence two matches.
    expect(screen.getByText("01:30:00")).toBeInTheDocument()
    expect(screen.getAllByText("02:00:00")).toHaveLength(2)

    // Grand total (footer): 1h30m + 2h = 3h30m.
    expect(screen.getByText("03:30:00")).toBeInTheDocument()
  })

  it("calls onSelectCell with the row's project and that column's day when a cell is clicked", async () => {
    const onSelectCell = vi.fn()
    const user = userEvent.setup()
    render(
      <WeeklyTimesheetGrid
        entries={ENTRIES}
        isLoading={false}
        periodStart="2026-08-24"
        timezone="UTC"
        onSelectCell={onSelectCell}
      />
    )

    await user.click(screen.getByText("01:00:00"))

    expect(onSelectCell).toHaveBeenCalledTimes(1)
    const [project, date] = onSelectCell.mock.calls[0]
    expect(project).toEqual(PROJECT_A)
    expect(format(date, "yyyy-MM-dd")).toBe("2026-08-24")
  })

  it("supports selecting a cell with the keyboard", async () => {
    const onSelectCell = vi.fn()
    const user = userEvent.setup()
    render(
      <WeeklyTimesheetGrid
        entries={ENTRIES}
        isLoading={false}
        periodStart="2026-08-24"
        timezone="UTC"
        onSelectCell={onSelectCell}
      />
    )

    const cell = screen.getByText("01:00:00")
    cell.focus()
    await user.keyboard("{Enter}")

    expect(onSelectCell).toHaveBeenCalledTimes(1)
  })
})
