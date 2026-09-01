import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { ApproveTimesheetButton } = await import(
  "@/features/approvals/components/ApproveTimesheetButton"
)

function renderButton() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ApproveTimesheetButton organizationId="org-1" userId="user-1" periodStart="2026-08-24" />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ApproveTimesheetButton", () => {
  it("requires confirmation before approving", async () => {
    const user = userEvent.setup()
    renderButton()

    await user.click(screen.getByRole("button", { name: "Approve" }))

    expect(await screen.findByText(/locks the week permanently/i)).toBeInTheDocument()
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it("calls approve_timesheet with the organization, user, and period on confirm", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: { id: "ts-1" }, error: null })
    const user = userEvent.setup()
    renderButton()

    await user.click(screen.getByRole("button", { name: "Approve" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Approve" }))

    await waitFor(() =>
      expect(mockSupabase.rpc).toHaveBeenCalledWith("approve_timesheet", {
        p_organization_id: "org-1",
        p_user_id: "user-1",
        p_period_start: "2026-08-24",
      })
    )
  })

  it("disables the trigger button while the approval is pending", async () => {
    let resolveApprove: (value: unknown) => void = () => {}
    mockSupabase.rpc.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveApprove = resolve
        })
    )
    const user = userEvent.setup()
    renderButton()

    await user.click(screen.getByRole("button", { name: "Approve" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Approve" }))

    await waitFor(() => expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled())

    resolveApprove({ data: { id: "ts-1" }, error: null })
  })
})
