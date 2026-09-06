import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { ChangePasswordForm } = await import("@/features/users/components/ChangePasswordForm")

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ChangePasswordForm email="me@example.com" />
    </QueryClientProvider>
  )
}

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  current: string,
  next: string,
  confirm = next
) {
  await user.type(screen.getByLabelText(/current password/i), current)
  await user.type(screen.getByLabelText(/^new password$/i), next)
  await user.type(screen.getByLabelText(/confirm new password/i), confirm)
  await user.click(screen.getByRole("button", { name: /update password/i }))
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ChangePasswordForm", () => {
  it("verifies the current password before changing it", async () => {
    // GoTrue has no "check this password" endpoint, so re-running the sign-in
    // is the check. Without it, an unlocked screen is enough to take over an
    // account.
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null })
    mockSupabase.auth.updateUser.mockResolvedValue({ data: {}, error: null })

    const user = userEvent.setup()
    renderForm()
    await fill(user, "0ldPassword", "N3wPassword")

    await waitFor(() =>
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "me@example.com",
        password: "0ldPassword",
      })
    )
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: "N3wPassword" })
  })

  it("does not change the password when the current one is wrong", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { code: "invalid_credentials", message: "Invalid login credentials" },
    })

    const user = userEvent.setup()
    renderForm()
    await fill(user, "wrongPassword1", "N3wPassword")

    // Reported on the field: a toast reading "incorrect email or password" next
    // to a form with no email in it is confusing.
    expect(await screen.findByText(/isn't your current password/i)).toBeInTheDocument()
    expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it("requires the new password to meet the policy and to match its confirmation", async () => {
    const user = userEvent.setup()
    renderForm()
    await fill(user, "0ldPassword", "weak", "alsoweak")

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/do not match/i)).toBeInTheDocument()
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it("rejects reusing the current password", async () => {
    const user = userEvent.setup()
    renderForm()
    await fill(user, "SamePassword1", "SamePassword1")

    expect(await screen.findByText(/different from your current one/i)).toBeInTheDocument()
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it("does not validate the current password against the policy", async () => {
    // An existing password may predate the current rules; validating it here
    // would reject a correct one.
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null })
    mockSupabase.auth.updateUser.mockResolvedValue({ data: {}, error: null })

    const user = userEvent.setup()
    renderForm()
    await fill(user, "old", "N3wPassword")

    await waitFor(() => expect(mockSupabase.auth.updateUser).toHaveBeenCalled())
  })
})
