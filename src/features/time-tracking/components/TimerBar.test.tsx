import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { TimerBar } = await import("@/features/time-tracking/components/TimerBar")

const PROJECT = {
  id: "project-1",
  name: "Website Redesign",
  color: "#3B82F6",
  description: null,
  status: "active",
  created_at: "2026-01-01T00:00:00.000Z",
  client: null,
}

const RUNNING_ENTRY = {
  id: "entry-1",
  description: "Fixing the header",
  start_time: "2026-08-24T09:00:00.000Z",
  end_time: null,
  duration_seconds: null,
  created_at: "2026-08-24T09:00:00.000Z",
  project: { id: "project-1", name: "Website Redesign", color: "#3B82F6" },
}

function mockFrom(runningEntry: unknown) {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === "projects") return createQueryBuilderMock({ data: [PROJECT], error: null })
    if (table === "time_entries")
      return createQueryBuilderMock({ data: runningEntry, error: null })
    throw new Error(`Unexpected table: ${table}`)
  })
}

function renderTimerBar() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <TimerBar organizationId="org-1" userId="user-1" />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("TimerBar", () => {
  it("disables Start until a description and a project are both set", async () => {
    mockFrom(null)
    const user = userEvent.setup()
    renderTimerBar()

    expect(await screen.findByRole("button", { name: /start/i })).toBeDisabled()

    await user.type(screen.getByPlaceholderText(/what are you working on/i), "Fixing the header")
    expect(screen.getByRole("button", { name: /start/i })).toBeDisabled()

    await user.click(screen.getByRole("combobox", { name: /project/i }))
    await user.click(await screen.findByText("Website Redesign"))

    expect(screen.getByRole("button", { name: /start/i })).toBeEnabled()
  })

  it("starts a timer with the entered description and selected project", async () => {
    mockFrom(null)
    mockSupabase.rpc.mockResolvedValue({ data: RUNNING_ENTRY, error: null })
    const user = userEvent.setup()
    renderTimerBar()

    await user.type(
      await screen.findByPlaceholderText(/what are you working on/i),
      "Fixing the header"
    )
    await user.click(screen.getByRole("combobox", { name: /project/i }))
    await user.click(await screen.findByText("Website Redesign"))
    await user.click(screen.getByRole("button", { name: /start/i }))

    await waitFor(() =>
      expect(mockSupabase.rpc).toHaveBeenCalledWith("start_time_entry", {
        p_organization_id: "org-1",
        p_project_id: "project-1",
        p_description: "Fixing the header",
      })
    )
  })

  it("shows a running timer as Stop with inputs locked, and stops it on click", async () => {
    mockFrom(RUNNING_ENTRY)
    const stopBuilder = createQueryBuilderMock({ data: { ...RUNNING_ENTRY, end_time: "now" }, error: null })
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "projects") return createQueryBuilderMock({ data: [PROJECT], error: null })
      if (table === "time_entries") return stopBuilder
      throw new Error(`Unexpected table: ${table}`)
    })
    const user = userEvent.setup()
    renderTimerBar()

    const stopButton = await screen.findByRole("button", { name: /stop/i })
    expect(screen.getByPlaceholderText(/what are you working on/i)).toBeDisabled()
    expect(screen.getByRole("combobox", { name: /project/i })).toBeDisabled()

    await user.click(stopButton)

    await waitFor(() => expect(stopBuilder.update).toHaveBeenCalledWith({ end_time: expect.any(String) }))
    expect(stopBuilder.eq).toHaveBeenCalledWith("id", "entry-1")
  })
})
