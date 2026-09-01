import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { format } from "date-fns"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"
import type { TimeEntry } from "@/features/time-tracking/services/time-entry.service"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { EditTimeEntryDialog } = await import("@/features/time-tracking/components/EditTimeEntryDialog")

const PROJECT = {
  id: "project-1",
  name: "Website Redesign",
  color: "#3B82F6",
  description: null,
  status: "active",
  created_at: "2026-01-01T00:00:00.000Z",
  client: null,
}

const FINISHED_ENTRY: TimeEntry = {
  id: "entry-1",
  description: "Fixing the header",
  start_time: "2026-08-24T09:00:00.000Z",
  end_time: "2026-08-24T10:30:00.000Z",
  duration_seconds: 5400,
  created_at: "2026-08-24T09:00:00.000Z",
  project: { id: "project-1", name: "Website Redesign", color: "#3B82F6" },
}

function renderDialog(entry: TimeEntry | null, onOpenChange = vi.fn()) {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === "projects") return createQueryBuilderMock({ data: [PROJECT], error: null })
    throw new Error(`Unexpected table: ${table}`)
  })
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <EditTimeEntryDialog
        entry={entry}
        organizationId="org-1"
        userId="user-1"
        onOpenChange={onOpenChange}
      />
    </QueryClientProvider>
  )
  return onOpenChange
}

// The dialog prefills date/time <input>s from the entry's UTC timestamp using
// the browser's local time zone (via date-fns' format()), the same as any
// native date/time input would -- so expectations are derived the same way,
// rather than hardcoded, to stay correct regardless of the machine running
// the test.
const EXPECTED_DATE = format(new Date(FINISHED_ENTRY.start_time), "yyyy-MM-dd")
const EXPECTED_START = format(new Date(FINISHED_ENTRY.start_time), "HH:mm")
const EXPECTED_END = format(new Date(FINISHED_ENTRY.end_time!), "HH:mm")

beforeEach(() => {
  vi.clearAllMocks()
})

describe("EditTimeEntryDialog", () => {
  it("prefills the form from the entry being edited", async () => {
    renderDialog(FINISHED_ENTRY)

    expect(await screen.findByDisplayValue("Fixing the header")).toBeInTheDocument()
    expect(screen.getByLabelText("Date")).toHaveValue(EXPECTED_DATE)
    expect(screen.getByLabelText("Start")).toHaveValue(EXPECTED_START)
    expect(screen.getByLabelText("End")).toHaveValue(EXPECTED_END)
  })

  it("hides the End field and sends no end time for a still-running entry", async () => {
    const runningEntry: TimeEntry = { ...FINISHED_ENTRY, end_time: null, duration_seconds: null }
    const entryBuilder = createQueryBuilderMock({ data: { id: "entry-1" }, error: null })
    const onOpenChange = renderDialog(runningEntry)
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "projects") return createQueryBuilderMock({ data: [PROJECT], error: null })
      if (table === "time_entries") return entryBuilder
      throw new Error(`Unexpected table: ${table}`)
    })
    const user = userEvent.setup()

    expect(await screen.findByText(/currently running/i)).toBeInTheDocument()
    expect(screen.queryByLabelText("End")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /save/i }))

    await waitFor(() =>
      expect(entryBuilder.update).toHaveBeenCalledWith({
        project_id: "project-1",
        description: "Fixing the header",
        start_time: new Date(`${EXPECTED_DATE}T${EXPECTED_START}`).toISOString(),
      })
    )
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("saves an edited finished entry with the recomposed start/end times", async () => {
    const entryBuilder = createQueryBuilderMock({ data: { id: "entry-1" }, error: null })
    const onOpenChange = renderDialog(FINISHED_ENTRY)
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "projects") return createQueryBuilderMock({ data: [PROJECT], error: null })
      if (table === "time_entries") return entryBuilder
      throw new Error(`Unexpected table: ${table}`)
    })
    const user = userEvent.setup()

    const description = await screen.findByDisplayValue("Fixing the header")
    await user.clear(description)
    await user.type(description, "Fixed the header layout")
    await user.click(screen.getByRole("button", { name: /save/i }))

    await waitFor(() =>
      expect(entryBuilder.update).toHaveBeenCalledWith({
        project_id: "project-1",
        description: "Fixed the header layout",
        start_time: new Date(`${EXPECTED_DATE}T${EXPECTED_START}`).toISOString(),
        end_time: new Date(`${EXPECTED_DATE}T${EXPECTED_END}`).toISOString(),
      })
    )
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})
