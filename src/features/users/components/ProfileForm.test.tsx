import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { ProfileForm } = await import("@/features/users/components/ProfileForm")
const { useAuthStore } = await import("@/features/auth/stores/authStore")

function renderForm(fullName: string | null) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ProfileForm fullName={fullName} email="me@example.com" />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ session: { user: { id: "user-1" } } as never })
})

describe("ProfileForm", () => {
  it("requires a non-empty name", async () => {
    const user = userEvent.setup()
    renderForm("Ana Owner")

    await user.clear(screen.getByLabelText(/full name/i))
    await user.click(screen.getByRole("button", { name: /save changes/i }))

    expect(await screen.findByText("Full name is required")).toBeInTheDocument()
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it("saves the updated name", async () => {
    const profilesBuilder = createQueryBuilderMock({ data: { id: "user-1" }, error: null })
    mockSupabase.from.mockReturnValue(profilesBuilder)
    const user = userEvent.setup()
    renderForm("Ana Owner")

    await user.clear(screen.getByLabelText(/full name/i))
    await user.type(screen.getByLabelText(/full name/i), "Ana Reviewer")
    await user.click(screen.getByRole("button", { name: /save changes/i }))

    await waitFor(() =>
      expect(profilesBuilder.update).toHaveBeenCalledWith({ full_name: "Ana Reviewer" })
    )
    expect(profilesBuilder.eq).toHaveBeenCalledWith("id", "user-1")
  })

  it("resyncs the field when the underlying profile name changes externally", () => {
    const { rerender } = renderForm("Ana Owner")
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Ana Owner")

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <ProfileForm fullName="Ana Reviewer" email="me@example.com" />
      </QueryClientProvider>
    )

    expect(screen.getByLabelText(/full name/i)).toHaveValue("Ana Reviewer")
  })
})
