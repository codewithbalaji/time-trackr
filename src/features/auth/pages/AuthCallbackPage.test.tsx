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

  it("routes an invite link to /invite/accept, keyed off invitation_token in user_metadata", async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "t",
          user: { user_metadata: { invitation_token: "token-1" } },
        },
      },
      error: null,
    })

    // No `type=invite` in the URL — Supabase's PKCE flow drops it, so this
    // must route off the session's user_metadata alone.
    renderCallback("/auth/callback")

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/invite/accept", { replace: true })
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
