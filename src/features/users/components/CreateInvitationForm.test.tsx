import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { CreateInvitationForm } = await import("@/features/users/components/CreateInvitationForm")
const { useAuthStore } = await import("@/features/auth/stores/authStore")

const ROLES = [
  { id: "role-owner", name: "Owner", is_system: true },
  { id: "role-admin", name: "Admin", is_system: true },
  { id: "role-member", name: "Member", is_system: true },
]

function renderForm() {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === "roles") return createQueryBuilderMock({ data: ROLES, error: null })
    throw new Error(`Unexpected table: ${table}`)
  })
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <CreateInvitationForm organizationId="org-1" />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ session: { user: { id: "user-owner" } } as never })
})

describe("CreateInvitationForm", () => {
  it("excludes Owner from the role picker and defaults to Member", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(await screen.findByRole("combobox", { name: /role/i }))
    const listbox = await screen.findByRole("listbox")

    expect(within(listbox).getByText("Admin")).toBeInTheDocument()
    expect(within(listbox).getByText("Member")).toBeInTheDocument()
    expect(within(listbox).queryByText("Owner")).not.toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.getByRole("combobox", { name: /role/i })).toHaveTextContent("Member")
  })

  it("requires a valid email before sending an invite", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByPlaceholderText(/teammate@example.com/i), "not-an-email")
    await user.click(screen.getByRole("button", { name: /send invite/i }))

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument()
    expect(mockSupabase.from).not.toHaveBeenCalledWith("invitations")
  })

  it("sends an invitation with the entered email and selected role, then clears the email field", async () => {
    const invitationsBuilder = createQueryBuilderMock({ data: { id: "invite-1" }, error: null })
    mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null })
    const user = userEvent.setup()
    renderForm()
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "roles") return createQueryBuilderMock({ data: ROLES, error: null })
      if (table === "invitations") return invitationsBuilder
      throw new Error(`Unexpected table: ${table}`)
    })

    await user.type(screen.getByPlaceholderText(/teammate@example.com/i), "new@example.com")
    await user.click(screen.getByRole("button", { name: /send invite/i }))

    await waitFor(() =>
      expect(invitationsBuilder.insert).toHaveBeenCalledWith({
        organization_id: "org-1",
        email: "new@example.com",
        role_id: "role-member",
        invited_by: "user-owner",
      })
    )
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/teammate@example.com/i)).toHaveValue("")
    )
  })
})
