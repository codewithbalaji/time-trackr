import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { RejectTimesheetDialog } = await import(
  "@/features/approvals/components/RejectTimesheetDialog"
)

function renderDialog() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <RejectTimesheetDialog organizationId="org-1" userId="user-1" periodStart="2026-08-24" />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("RejectTimesheetDialog", () => {
  it("requires a reason before submitting", async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole("button", { name: "Reject" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Reject" }))

    expect(await screen.findByText("Enter a reason.")).toBeInTheDocument()
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it("calls reject_timesheet with the reason and closes on success", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: { id: "ts-1" }, error: null })
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole("button", { name: "Reject" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByLabelText(/reason/i), "Missing hours on Tuesday")
    await user.click(within(dialog).getByRole("button", { name: "Reject" }))

    await waitFor(() =>
      expect(mockSupabase.rpc).toHaveBeenCalledWith("reject_timesheet", {
        p_organization_id: "org-1",
        p_user_id: "user-1",
        p_period_start: "2026-08-24",
        p_reason: "Missing hours on Tuesday",
      })
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("shows a pending state while rejecting", async () => {
    let resolveReject: (value: unknown) => void = () => {}
    mockSupabase.rpc.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReject = resolve
        })
    )
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole("button", { name: "Reject" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByLabelText(/reason/i), "Missing hours")
    await user.click(within(dialog).getByRole("button", { name: "Reject" }))

    expect(await screen.findByRole("button", { name: /rejecting/i })).toBeDisabled()

    resolveReject({ data: { id: "ts-1" }, error: null })
  })
})
