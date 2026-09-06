import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { ThemeProvider } = await import("@/app/providers/ThemeProvider")
const { useTheme } = await import("@/hooks/use-theme")
const { useAuthStore } = await import("@/features/auth/stores/authStore")

function Probe() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme("light")}>go light</button>
    </div>
  )
}

function renderProvider() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

function profileReturning(theme: string) {
  return createQueryBuilderMock({
    data: { id: "user-1", full_name: "Ana", email: "ana@example.com", theme },
    error: null,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  document.documentElement.classList.remove("dark")
  useAuthStore.setState({ session: { user: { id: "user-1" } } as never })
})

describe("ThemeProvider", () => {
  it("adopts the theme stored on the profile, so it follows the user across devices", async () => {
    mockSupabase.from.mockReturnValue(profileReturning("light"))

    renderProvider()

    await waitFor(() => expect(screen.getByTestId("theme")).toHaveTextContent("light"))
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("paints the cached theme first, before the profile query resolves", () => {
    // Without the cache the first paint is the default, then it snaps to the
    // stored value once the query lands -- a visible flash on every load.
    localStorage.setItem("time-trackr-theme", "light")
    mockSupabase.from.mockReturnValue(profileReturning("light"))

    renderProvider()

    expect(screen.getByTestId("theme")).toHaveTextContent("light")
  })

  it("persists an explicit choice to the profile and to the cache", async () => {
    mockSupabase.from.mockReturnValue(profileReturning("dark"))
    const user = userEvent.setup()

    renderProvider()
    await waitFor(() => expect(screen.getByTestId("theme")).toHaveTextContent("dark"))

    await user.click(screen.getByRole("button", { name: /go light/i }))

    expect(screen.getByTestId("theme")).toHaveTextContent("light")
    expect(localStorage.getItem("time-trackr-theme")).toBe("light")
    await waitFor(() =>
      expect(mockSupabase.from).toHaveBeenCalledWith("profiles")
    )
  })

  it("falls back to the default when there is nothing stored anywhere", async () => {
    mockSupabase.from.mockReturnValue(createQueryBuilderMock({ data: null, error: null }))

    renderProvider()

    await waitFor(() => expect(screen.getByTestId("theme")).toHaveTextContent("dark"))
  })
})
