import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { ForgotPasswordForm } = await import("@/features/auth/components/ForgotPasswordForm")

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ForgotPasswordForm />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ForgotPasswordForm", () => {
  it("requires a valid email before sending", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/email/i), "nope")
    await user.click(screen.getByRole("button", { name: /send reset link/i }))

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
    expect(mockSupabase.auth.resetPasswordForEmail).not.toHaveBeenCalled()
  })

  it("replaces the form once sent, so the button can't be hammered", async () => {
    // A live Send button after a successful send invites a second click, which
    // just trips over_email_send_rate_limit and looks like the first failed.
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/email/i), "me@example.com")
    await user.click(screen.getByRole("button", { name: /send reset link/i }))

    expect(await screen.findByText(/check your email/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /send reset link/i })).not.toBeInTheDocument()
  })

  it("hedges about whether the address is registered", async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/email/i), "me@example.com")
    await user.click(screen.getByRole("button", { name: /send reset link/i }))

    expect(await screen.findByText(/if an account exists/i)).toBeInTheDocument()
  })

  it("lets the user go back and correct the address", async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/email/i), "me@example.com")
    await user.click(screen.getByRole("button", { name: /send reset link/i }))
    await user.click(await screen.findByRole("button", { name: /different email/i }))

    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInTheDocument())
  })
})
