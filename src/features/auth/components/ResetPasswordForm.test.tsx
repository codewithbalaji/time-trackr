import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const navigateMock = vi.fn()
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useNavigate: () => navigateMock }
})

const { ResetPasswordForm } = await import("@/features/auth/components/ResetPasswordForm")

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ResetPasswordForm />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ResetPasswordForm", () => {
  it("enforces the password policy and the confirmation match", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/^new password$/i), "short")
    await user.type(screen.getByLabelText(/confirm new password/i), "different")
    await user.click(screen.getByRole("button", { name: /update password/i }))

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/do not match/i)).toBeInTheDocument()
    expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it("lands on the app root rather than bouncing through /login", async () => {
    // A recovery link leaves a full session behind, so navigating to /login
    // just hit redirectIfAuthenticated and redirected twice more.
    mockSupabase.auth.updateUser.mockResolvedValue({ data: {}, error: null })
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/^new password$/i), "Str0ngPassword")
    await user.type(screen.getByLabelText(/confirm new password/i), "Str0ngPassword")
    await user.click(screen.getByRole("button", { name: /update password/i }))

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/", { replace: true })
    )
    expect(navigateMock).not.toHaveBeenCalledWith("/login")
  })
})
