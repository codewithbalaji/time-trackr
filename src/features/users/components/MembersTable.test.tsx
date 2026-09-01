import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient, createQueryBuilderMock } from "@/test/supabase-mock"
import type { OrgMember } from "@/features/users/services/membership.service"

const mockSupabase = createMockSupabaseClient()
vi.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

const { MembersTable } = await import("@/features/users/components/MembersTable")
const { useAuthStore } = await import("@/features/auth/stores/authStore")

const ROLES = [
  { id: "role-owner", name: "Owner", is_system: true },
  { id: "role-admin", name: "Admin", is_system: true },
  { id: "role-member", name: "Member", is_system: true },
]

const SELF: OrgMember = {
  id: "membership-self",
  role: { id: "role-admin", name: "Admin" },
  status: "active",
  created_at: "2026-01-01T00:00:00.000Z",
  profile: { id: "user-me", full_name: "Me Admin", email: "me@example.com" },
}

const OWNER: OrgMember = {
  id: "membership-owner",
  role: { id: "role-owner", name: "Owner" },
  status: "active",
  created_at: "2026-01-01T00:00:00.000Z",
  profile: { id: "user-owner", full_name: "Owner Person", email: "owner@example.com" },
}

const OTHER: OrgMember = {
  id: "membership-other",
  role: { id: "role-member", name: "Member" },
  status: "active",
  created_at: "2026-01-01T00:00:00.000Z",
  profile: { id: "user-other", full_name: "Other Member", email: "other@example.com" },
}

// "memberships" backs three different call shapes here (listMyPermissions'
// nested select+single, updateMembershipStatus's update+single, and
// removeMember's delete) -- a single fixed-result createQueryBuilderMock
// can't serve all three, so this tracks which one is in flight per call.
function createMembershipsBuilder(permissionKeys: string[]) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {}
  let mode: "permissions" | "update" | "delete" = "permissions"
  builder.select = vi.fn(() => builder)
  builder.update = vi.fn(() => {
    mode = "update"
    return builder
  })
  builder.delete = vi.fn(() => {
    mode = "delete"
    return builder
  })
  builder.eq = vi.fn(() => builder)
  builder.order = vi.fn(() => builder)
  builder.single = vi.fn(() => {
    if (mode === "update") return Promise.resolve({ data: { id: "updated" }, error: null })
    return Promise.resolve({
      data: { role: { role_permissions: permissionKeys.map((key) => ({ permission: { key } })) } },
      error: null,
    })
  })
  builder.then = vi.fn((resolve) => Promise.resolve({ error: null }).then(resolve))
  return builder
}

function mockFrom(permissionKeys: string[]) {
  const membershipsBuilder = createMembershipsBuilder(permissionKeys)
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === "memberships") return membershipsBuilder
    if (table === "roles") return createQueryBuilderMock({ data: ROLES, error: null })
    throw new Error(`Unexpected table: ${table}`)
  })
  return membershipsBuilder
}

function renderTable(members: OrgMember[], permissionKeys: string[]) {
  const membershipsBuilder = mockFrom(permissionKeys)
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <MembersTable
        members={members}
        isLoading={false}
        organizationId="org-1"
        canManageMembers
      />
    </QueryClientProvider>
  )
  return membershipsBuilder
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ session: { user: { id: "user-me" } } as never })
})

describe("MembersTable", () => {
  it("shows the loading state", () => {
    mockFrom([])
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <MembersTable members={[]} isLoading organizationId="org-1" canManageMembers />
      </QueryClientProvider>
    )
    expect(screen.getByText(/loading members/i)).toBeInTheDocument()
  })

  it("shows the empty state when there are no members", () => {
    mockFrom([])
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <MembersTable members={[]} isLoading={false} organizationId="org-1" canManageMembers />
      </QueryClientProvider>
    )
    expect(screen.getByText("No members yet")).toBeInTheDocument()
  })

  it("never shows an action menu for the signed-in user's own row or the Owner's row", async () => {
    renderTable([SELF, OWNER, OTHER], ["roles.assign", "members.manage_status", "members.remove"])

    await screen.findByText("Other Member")
    expect(screen.getAllByRole("button", { name: /member actions/i })).toHaveLength(1)
    expect(screen.getByText("Me Admin")).toBeInTheDocument()
    expect(screen.getByText("Owner Person")).toBeInTheDocument()
  })

  it("shows the role as a read-only badge without roles.assign, and a picker with it", async () => {
    const { rerender } = render(
      <QueryClientProvider client={new QueryClient()}>
        <MembersTable members={[OTHER]} isLoading={false} organizationId="org-1" canManageMembers />
      </QueryClientProvider>
    )
    mockFrom([])
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MembersTable members={[OTHER]} isLoading={false} organizationId="org-1" canManageMembers />
      </QueryClientProvider>
    )
    expect(await screen.findByText("Member")).toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()

    mockFrom(["roles.assign"])
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MembersTable members={[OTHER]} isLoading={false} organizationId="org-1" canManageMembers />
      </QueryClientProvider>
    )
    expect(await screen.findByRole("combobox")).toBeInTheDocument()
  })

  it("requires confirmation before suspending a member", async () => {
    const membershipsBuilder = renderTable([OTHER], ["members.manage_status"])
    const user = userEvent.setup()

    await user.click(await screen.findByRole("button", { name: /member actions/i }))
    await user.click((await screen.findByRole("menu")).querySelector("[role=menuitem]")!)

    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText(/suspend other member/i)).toBeInTheDocument()
    expect(membershipsBuilder.update).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole("button", { name: "Suspend" }))

    await waitFor(() => expect(membershipsBuilder.update).toHaveBeenCalledWith({ status: "suspended" }))
    expect(membershipsBuilder.eq).toHaveBeenCalledWith("id", "membership-other")
  })

  it("reactivates a suspended member immediately, without a confirmation step", async () => {
    const suspended = { ...OTHER, status: "suspended" as const }
    const membershipsBuilder = renderTable([suspended], ["members.manage_status"])
    const user = userEvent.setup()

    await user.click(await screen.findByRole("button", { name: /member actions/i }))
    const menu = await screen.findByRole("menu")
    await user.click(within(menu).getByText("Reactivate"))

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    await waitFor(() => expect(membershipsBuilder.update).toHaveBeenCalledWith({ status: "active" }))
  })

  it("requires confirmation before removing a member", async () => {
    const membershipsBuilder = renderTable([OTHER], ["members.remove"])
    const user = userEvent.setup()

    await user.click(await screen.findByRole("button", { name: /member actions/i }))
    const menu = await screen.findByRole("menu")
    await user.click(within(menu).getByText("Remove"))

    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText(/remove other member/i)).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Remove" }))

    await waitFor(() => expect(membershipsBuilder.delete).toHaveBeenCalled())
    expect(membershipsBuilder.eq).toHaveBeenCalledWith("id", "membership-other")
  })

  it("requires confirmation before changing a member's role", async () => {
    renderTable([OTHER], ["roles.assign"])
    const user = userEvent.setup()

    await user.click(await screen.findByRole("combobox"))
    await user.click(await screen.findByText("Admin"))

    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText(/change other member's role to admin/i)).toBeInTheDocument()
    expect(mockSupabase.rpc).not.toHaveBeenCalled()

    mockSupabase.rpc.mockResolvedValue({ data: { id: "membership-other" }, error: null })
    await user.click(within(dialog).getByRole("button", { name: "Change role" }))

    await waitFor(() =>
      expect(mockSupabase.rpc).toHaveBeenCalledWith("assign_membership_role", {
        p_membership_id: "membership-other",
        p_role_id: "role-admin",
      })
    )
  })
})
