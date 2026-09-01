import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"
import type { Client } from "@/features/clients/services/client.service"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { ClientsTable } = await import("@/features/clients/components/ClientsTable")

const CLIENT: Client = {
  id: "client-1",
  name: "Acme Corp",
  status: "active",
  created_at: "2026-08-01T00:00:00.000Z",
}

function renderTable(canManageClients: boolean) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ClientsTable
        clients={[CLIENT]}
        isLoading={false}
        organizationId="org-1"
        canManageClients={canManageClients}
      />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ClientsTable", () => {
  it("shows the loading state", () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <ClientsTable clients={[]} isLoading organizationId="org-1" canManageClients={false} />
      </QueryClientProvider>
    )
    expect(screen.getByText(/loading clients/i)).toBeInTheDocument()
  })

  it("shows the empty state when there are no clients", () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <ClientsTable clients={[]} isLoading={false} organizationId="org-1" canManageClients={false} />
      </QueryClientProvider>
    )
    expect(screen.getByText("No clients yet")).toBeInTheDocument()
  })

  it("hides row actions for a member without clients.manage", () => {
    renderTable(false)
    expect(screen.getByText("Acme Corp")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /client actions/i })).not.toBeInTheDocument()
  })

  it("lets a member with clients.manage archive an active client", async () => {
    const builder = createQueryBuilderMock({
      data: { ...CLIENT, status: "archived" },
      error: null,
    })
    mockSupabase.from.mockReturnValue(builder)
    const user = userEvent.setup()
    renderTable(true)

    await user.click(screen.getByRole("button", { name: /client actions/i }))
    const menu = await screen.findByRole("menu")
    await user.click(within(menu).getByText("Archive"))

    await waitFor(() => expect(builder.update).toHaveBeenCalledWith({ status: "archived" }))
    expect(builder.eq).toHaveBeenCalledWith("id", "client-1")
  })
})
