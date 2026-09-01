import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { InviteAcceptForm } = await import("@/features/users/components/InviteAcceptForm")
const { useAuthStore } = await import("@/features/auth/stores/authStore")

function renderForm() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <InviteAcceptForm token="token-1" email="new@example.com" organizationName="Acme Inc" />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

async function fillForm(user: ReturnType<typeof userEvent.setup>, confirmPassword = "Password1") {
  await user.type(screen.getByLabelText(/full name/i), "New Person")
  await user.type(screen.getByLabelText(/^password$/i), "Password1")
  await user.type(screen.getByLabelText(/confirm password/i), confirmPassword)
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ session: { user: { id: "user-1" } } as never })
})

describe("InviteAcceptForm", () => {
  it("shows a validation error and makes no network calls when passwords don't match", async () => {
    const user = userEvent.setup()
    renderForm()

    await fillForm(user, "Different1")
    await user.click(screen.getByRole("button", { name: /join organization/i }))

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument()
    expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it("sets the password/name, syncs the profile, and accepts the invitation on success", async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({ data: { user: {} }, error: null })
    const profilesBuilder = createQueryBuilderMock({ data: { id: "user-1" }, error: null })
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") return profilesBuilder
      throw new Error(`Unexpected table: ${table}`)
    })
    mockSupabase.rpc.mockResolvedValue({ data: { organization_id: "org-1" }, error: null })
    const user = userEvent.setup()
    renderForm()

    await fillForm(user)
    await user.click(screen.getByRole("button", { name: /join organization/i }))

    await waitFor(() =>
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: "Password1",
        data: { full_name: "New Person" },
      })
    )
    await waitFor(() =>
      expect(profilesBuilder.update).toHaveBeenCalledWith({ full_name: "New Person" })
    )
    await waitFor(() =>
      expect(mockSupabase.rpc).toHaveBeenCalledWith("accept_invitation", { p_token: "token-1" })
    )
  })

  it("stops and shows an error without accepting the invitation if setting the password fails", async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: null },
      error: { message: "weak_password" },
    })
    const user = userEvent.setup()
    renderForm()

    await fillForm(user)
    await user.click(screen.getByRole("button", { name: /join organization/i }))

    await waitFor(() => expect(mockSupabase.auth.updateUser).toHaveBeenCalled())
    expect(mockSupabase.from).not.toHaveBeenCalledWith("profiles")
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })
})
