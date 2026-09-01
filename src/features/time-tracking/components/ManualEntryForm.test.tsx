import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { ManualEntryForm } = await import("@/features/time-tracking/components/ManualEntryForm")

const PROJECT = {
  id: "project-1",
  name: "Website Redesign",
  color: "#3B82F6",
  description: null,
  status: "active",
  created_at: "2026-01-01T00:00:00.000Z",
  client: null,
}

function renderForm() {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === "projects") return createQueryBuilderMock({ data: [PROJECT], error: null })
    throw new Error(`Unexpected table: ${table}`)
  })
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ManualEntryForm organizationId="org-1" userId="user-1" initialDate="2026-08-24" />
    </QueryClientProvider>
  )
}

async function fillValidEntry(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText(/what did you work on/i), "Wrote the report")
  await user.click(screen.getByRole("combobox", { name: /project/i }))
  const listbox = await screen.findByRole("listbox")
  await user.click(within(listbox).getByText("Website Redesign"))
  await user.type(screen.getByLabelText("Start"), "09:00")
  return user
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ManualEntryForm", () => {
  it("creates a manual entry with ISO start/end times composed from date + time fields", async () => {
    const entryBuilder = createQueryBuilderMock({ data: { id: "entry-1" }, error: null })
    const user = userEvent.setup()
    renderForm()
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "projects") return createQueryBuilderMock({ data: [PROJECT], error: null })
      if (table === "time_entries") return entryBuilder
      throw new Error(`Unexpected table: ${table}`)
    })

    await fillValidEntry(user)
    await user.type(screen.getByLabelText("End"), "10:30")
    await user.click(screen.getByRole("button", { name: /add entry/i }))

    await waitFor(() =>
      expect(entryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: "org-1",
          user_id: "user-1",
          project_id: "project-1",
          description: "Wrote the report",
          start_time: new Date("2026-08-24T09:00").toISOString(),
          end_time: new Date("2026-08-24T10:30").toISOString(),
        })
      )
    )
  })

  it("blocks submission and shows a validation error when the end time isn't after the start time", async () => {
    const user = userEvent.setup()
    renderForm()

    await fillValidEntry(user)
    await user.type(screen.getByLabelText("End"), "08:00")
    await user.click(screen.getByRole("button", { name: /add entry/i }))

    expect(await screen.findByText("End time must be after start time")).toBeInTheDocument()
    expect(mockSupabase.from).not.toHaveBeenCalledWith("time_entries")
  })
})
