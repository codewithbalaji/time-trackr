import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
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

const { InviteAcceptPage } = await import("@/features/users/pages/InviteAcceptPage")
const { useAuthStore } = await import("@/features/auth/stores/authStore")

const TOKEN = "11111111-1111-1111-1111-111111111111"

function inWeeks(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

function invitation(overrides: Record<string, unknown> = {}) {
  return [
    {
      email: "invitee@example.com",
      role_name: "Member",
      status: "pending",
      expires_at: inWeeks(7),
      organization_name: "Acme",
      ...overrides,
    },
  ]
}

function renderPage(path = `/invite/accept?token=${TOKEN}`) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <InviteAcceptPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ session: null, status: "unauthenticated" })
})

describe("InviteAcceptPage", () => {
  it("reads the token from the URL rather than from session metadata", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: invitation(), error: null })

    renderPage()

    await waitFor(() =>
      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_invitation_by_token", {
        p_token: TOKEN,
      })
    )
  })

  it("asks a signed-out invitee to create an account", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: invitation(), error: null })

    renderPage()

    expect(await screen.findByText(/join acme/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      expect.stringContaining(encodeURIComponent(`/invite/accept?token=${TOKEN}`))
    )
  })

  it("lets a signed-in invitee accept directly", async () => {
    useAuthStore.setState({
      session: { user: { id: "u-1", email: "invitee@example.com" } } as never,
      status: "authenticated",
    })
    mockSupabase.rpc.mockImplementation((fn: string) =>
      fn === "get_invitation_by_token"
        ? Promise.resolve({ data: invitation(), error: null })
        : Promise.resolve({ data: { organization_id: "org-1" }, error: null })
    )

    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole("button", { name: /accept invitation/i }))

    await waitFor(() =>
      expect(mockSupabase.rpc).toHaveBeenCalledWith("accept_invitation", { p_token: TOKEN })
    )
  })

  it("explains the mismatch when signed in as someone else", async () => {
    useAuthStore.setState({
      session: { user: { id: "u-2", email: "someone.else@example.com" } } as never,
      status: "authenticated",
    })
    mockSupabase.rpc.mockResolvedValue({ data: invitation(), error: null })

    renderPage()

    expect(await screen.findByText(/different account/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument()
  })

  it("says so up front when the invitation has expired", async () => {
    // The RPC deliberately still returns expired rows so this branch can tell
    // "expired" apart from "no such invitation".
    mockSupabase.rpc.mockResolvedValue({
      data: invitation({ expires_at: inWeeks(-1) }),
      error: null,
    })

    renderPage()

    expect(await screen.findByText(/has expired/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /create account/i })).not.toBeInTheDocument()
  })

  it("reports an already-accepted invitation as no longer active", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: invitation({ status: "accepted" }), error: null })

    renderPage()

    expect(await screen.findByText(/no longer active/i)).toBeInTheDocument()
  })

  it("handles a link with no token at all", async () => {
    renderPage("/invite/accept")

    expect(await screen.findByText(/incomplete/i)).toBeInTheDocument()
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })
})
