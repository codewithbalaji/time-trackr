import { render, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const navigateMock = vi.fn()
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useNavigate: () => navigateMock }
})

const { AuthCallbackPage } = await import("@/features/auth/pages/AuthCallbackPage")

function renderCallback(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthCallbackPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("AuthCallbackPage", () => {
  it("routes a recovery link to /reset-password", async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "t" } },
      error: null,
    })

    renderCallback("/auth/callback?type=recovery")

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/reset-password", { replace: true })
    )
  })

  it("no longer treats a leftover invitation_token as an invite link", async () => {
    // Invitations don't route through this page any more: their emailed link
    // points straight at /invite/accept?token=..., and the stale
    // user_metadata.invitation_token that used to drive this branch was
    // sending already-onboarded users to a dead invitation on every
    // subsequent email login.
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "t",
          user: { user_metadata: { invitation_token: "token-1" } },
        },
      },
      error: null,
    })

    renderCallback("/auth/callback")

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/onboarding", { replace: true })
    )
  })

  it("routes a signup confirmation link to /onboarding", async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "t" } },
      error: null,
    })

    renderCallback("/auth/callback")

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/onboarding", { replace: true })
    )
  })

  it("shows an invalid-link state when no session is established", async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })

    const { findByText } = renderCallback("/auth/callback")

    expect(await findByText(/this link is invalid or has expired/i)).toBeTruthy()
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
