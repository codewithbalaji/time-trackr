import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"
import type { Project } from "@/features/projects/services/project.service"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { ProjectsTable } = await import("@/features/projects/components/ProjectsTable")

const PROJECT: Project = {
  id: "project-1",
  name: "Website Redesign",
  color: "#3B82F6",
  description: null,
  status: "active",
  created_at: "2026-08-01T00:00:00.000Z",
  client: { id: "client-1", name: "Acme Corp" },
}

// The edit and "manage members" dialogs are always mounted (just closed), so
// their hooks (useClients, useOrgMembers) fire on every render regardless of
// which row action is exercised -- give every table a harmless empty default.
function mockFrom(overrides: Record<string, ReturnType<typeof createQueryBuilderMock>> = {}) {
  mockSupabase.from.mockImplementation((table: string) => {
    if (overrides[table]) return overrides[table]
    return createQueryBuilderMock({ data: [], error: null })
  })
}

function renderTable(canManageProjects: boolean) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectsTable
        projects={[PROJECT]}
        isLoading={false}
        organizationId="org-1"
        canManageProjects={canManageProjects}
      />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ProjectsTable", () => {
  it("shows the loading state", () => {
    mockFrom()
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <ProjectsTable projects={[]} isLoading organizationId="org-1" canManageProjects={false} />
      </QueryClientProvider>
    )
    expect(screen.getByText(/loading projects/i)).toBeInTheDocument()
  })

  it("shows the empty state when there are no projects", () => {
    mockFrom()
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <ProjectsTable projects={[]} isLoading={false} organizationId="org-1" canManageProjects={false} />
      </QueryClientProvider>
    )
    expect(screen.getByText("No projects yet")).toBeInTheDocument()
  })

  it("hides row actions and shows the project's client for a member without projects.manage", () => {
    mockFrom()
    renderTable(false)

    expect(screen.getByText("Website Redesign")).toBeInTheDocument()
    expect(screen.getByText("Acme Corp")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /project actions/i })).not.toBeInTheDocument()
  })

  it("lets a member with projects.manage archive an active project", async () => {
    const projectsBuilder = createQueryBuilderMock({
      data: { ...PROJECT, status: "archived" },
      error: null,
    })
    mockFrom({ projects: projectsBuilder })
    const user = userEvent.setup()
    renderTable(true)

    await user.click(screen.getByRole("button", { name: /project actions/i }))
    const menu = await screen.findByRole("menu")
    await user.click(within(menu).getByText("Archive"))

    await waitFor(() => expect(projectsBuilder.update).toHaveBeenCalledWith({ status: "archived" }))
    expect(projectsBuilder.eq).toHaveBeenCalledWith("id", "project-1")
  })
})
