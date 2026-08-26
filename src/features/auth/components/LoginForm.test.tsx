import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { LoginForm } = await import("@/features/auth/components/LoginForm")

function renderLoginForm() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("LoginForm", () => {
  it("shows validation errors and does not call the service on empty submit", async () => {
    const user = userEvent.setup()
    renderLoginForm()

    await user.click(screen.getByRole("button", { name: /sign in/i }))

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it("submits valid credentials and disables the button while pending", async () => {
    let resolveLogin: (value: unknown) => void = () => {}
    mockSupabase.auth.signInWithPassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve
        })
    )
    const user = userEvent.setup()
    renderLoginForm()

    await user.type(screen.getByLabelText(/email/i), "user@example.com")
    await user.type(screen.getByLabelText(/password/i), "Password1")
    await user.click(screen.getByRole("button", { name: /sign in/i }))

    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled()

    resolveLogin({ data: { user: null, session: null }, error: null })

    await waitFor(() =>
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Password1",
      })
    )
  })
})
