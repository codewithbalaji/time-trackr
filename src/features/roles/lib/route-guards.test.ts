import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAuthStore } from "@/features/auth/stores/authStore"
import { queryClient } from "@/lib/queryClient"
import { useOrganizationStore } from "@/features/organizations/stores/organizationStore"

vi.mock("@/features/roles/services/role.service", () => ({
  hasPermission: vi.fn(),
}))

const { hasPermission } = await import("@/features/roles/services/role.service")
const { requirePermission } = await import("@/features/roles/lib/route-guards")

function isRedirectTo(error: unknown, path: string) {
  return (
    error instanceof Response && error.status === 302 && error.headers.get("Location") === path
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  queryClient.clear()
  useAuthStore.setState({
    session: { user: { id: "user-1" } } as never,
    status: "authenticated",
  })
  useOrganizationStore.setState({ currentOrganizationId: "org-1" })
})

describe("requirePermission", () => {
  it("redirects to /login when there is no session", async () => {
    useAuthStore.setState({ session: null, status: "unauthenticated" })

    await expect(requirePermission("roles.assign")()).rejects.toSatisfy((error: unknown) =>
      isRedirectTo(error, "/login")
    )
  })

  it("redirects to /select-organization when no organization is selected", async () => {
    useOrganizationStore.setState({ currentOrganizationId: null })

    await expect(requirePermission("roles.assign")()).rejects.toSatisfy((error: unknown) =>
      isRedirectTo(error, "/select-organization")
    )
  })

  it("redirects to / when the user lacks the permission", async () => {
    vi.mocked(hasPermission).mockResolvedValue(false)

    await expect(requirePermission("roles.assign")()).rejects.toSatisfy((error: unknown) =>
      isRedirectTo(error, "/")
    )
  })

  it("resolves when the user has the permission", async () => {
    vi.mocked(hasPermission).mockResolvedValue(true)

    await expect(requirePermission("roles.assign")()).resolves.toBeNull()
  })
})
