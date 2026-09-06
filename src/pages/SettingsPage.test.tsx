import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { SettingsPage } = await import("@/pages/SettingsPage")
const { ThemeProvider } = await import("@/app/providers/ThemeProvider")
const { useAuthStore } = await import("@/features/auth/stores/authStore")
const { useOrganizationStore } = await import(
  "@/features/organizations/stores/organizationStore"
)

const TIME_SETTINGS = {
  timezone: "Europe/London",
  date_format: "MM/DD/YYYY" as const,
  time_format: "24h" as const,
  day_start: "00:00:00",
}

const MEMBERSHIP = {
  id: "m-1",
  role: { id: "r-1", name: "Member" },
  status: "active" as const,
  created_at: "2026-01-01T00:00:00Z",
  organization: { id: "org-1", name: "Acme", ...TIME_SETTINGS },
}

function renderPage(path = "/settings") {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === "memberships") {
      return createQueryBuilderMock({ data: [MEMBERSHIP], error: null })
    }
    if (table === "profiles") {
      return createQueryBuilderMock({
        data: { id: "user-1", full_name: "Ana", email: "ana@example.com", theme: "dark" },
        error: null,
      })
    }
    throw new Error(`Unexpected table: ${table}`)
  })
  // has_permission: not an owner, so the organization tab is read-only.
  mockSupabase.rpc.mockResolvedValue({ data: false, error: null })

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  // ThemeProvider comes from ProtectedLayout in the app; the Appearance
  // setting reads it.
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[path]}>
          <SettingsPage />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ session: { user: { id: "user-1" } } as never })
  useOrganizationStore.setState({ currentOrganizationId: "org-1" })
})

describe("SettingsPage", () => {
  it("opens on the organization tab by default", async () => {
    renderPage()

    expect(await screen.findByRole("tab", { name: /organization/i })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(await screen.findByText(/time settings/i)).toBeInTheDocument()
  })

  it("opens the account tab when the URL asks for it", async () => {
    // /profile redirects here, and the sidebar's account row links here.
    renderPage("/settings?tab=account")

    expect(await screen.findByRole("tab", { name: /account/i })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(await screen.findByText(/appearance/i)).toBeInTheDocument()
    expect(screen.getByText(/^password$/i)).toBeInTheDocument()
  })

  it("ignores an unrecognised tab rather than rendering nothing", async () => {
    renderPage("/settings?tab=nonsense")

    expect(await screen.findByRole("tab", { name: /organization/i })).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })

  it("switches tabs on click", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole("tab", { name: /account/i }))

    await waitFor(() => expect(screen.getByText(/appearance/i)).toBeInTheDocument())
  })

  it("shows organization settings read-only without organization.manage_settings", async () => {
    // Admins are deliberately denied that permission, and used to be locked out
    // of the route entirely rather than shown a read-only view.
    renderPage()

    expect(await screen.findByText(/only an owner can change them/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/organization name/i)).not.toBeInTheDocument()
    expect(screen.getByText("Europe/London")).toBeInTheDocument()
  })
})
