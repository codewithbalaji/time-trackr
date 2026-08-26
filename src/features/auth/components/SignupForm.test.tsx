import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { SignupForm } = await import("@/features/auth/components/SignupForm")

function renderSignupForm(onSubmitted: (email: string) => void = vi.fn()) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SignupForm onSubmitted={onSubmitted} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("SignupForm", () => {
  it("shows a validation error when passwords do not match", async () => {
    const user = userEvent.setup()
    renderSignupForm()

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe")
    await user.type(screen.getByLabelText(/email/i), "jane@example.com")
    await user.type(screen.getByLabelText(/^password$/i), "Password1")
    await user.type(screen.getByLabelText(/confirm password/i), "Different1")
    await user.click(screen.getByRole("button", { name: /create account/i }))

    expect(
      await screen.findByText(/passwords do not match/i)
    ).toBeInTheDocument()
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
  })

  it("submits valid signup details and reports the submitted email", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    })
    const onSubmitted = vi.fn()
    const user = userEvent.setup()
    renderSignupForm(onSubmitted)

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe")
    await user.type(screen.getByLabelText(/email/i), "jane@example.com")
    await user.type(screen.getByLabelText(/^password$/i), "Password1")
    await user.type(screen.getByLabelText(/confirm password/i), "Password1")
    await user.click(screen.getByRole("button", { name: /create account/i }))

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "jane@example.com",
        password: "Password1",
        options: expect.objectContaining({
          data: { full_name: "Jane Doe" },
        }),
      })
    )
    expect(onSubmitted).toHaveBeenCalledWith("jane@example.com")
  })
})
