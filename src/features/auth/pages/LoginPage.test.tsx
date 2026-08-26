import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const toastError = vi.fn()
vi.mock("sonner", () => ({ toast: { error: toastError, success: vi.fn() } }))

const { LoginPage } = await import("@/features/auth/pages/LoginPage")

function renderLoginPage() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("login workflow", () => {
  it("logs in successfully with valid credentials", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "1" }, session: { access_token: "t" } },
      error: null,
    })
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), "user@example.com")
    await user.type(screen.getByLabelText(/password/i), "Password1")
    await user.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() =>
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled()
    )
    expect(toastError).not.toHaveBeenCalled()
  })

  it("shows a mapped error toast for invalid credentials", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { code: "invalid_credentials", message: "bad creds" },
    })
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), "user@example.com")
    await user.type(screen.getByLabelText(/password/i), "wrong")
    await user.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Incorrect email or password.")
    )
  })

  it("shows a mapped error toast for an unconfirmed email", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { code: "email_not_confirmed", message: "not confirmed" },
    })
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), "user@example.com")
    await user.type(screen.getByLabelText(/password/i), "Password1")
    await user.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Please verify your email before signing in."
      )
    )
  })
})
