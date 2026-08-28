import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAuthStore } from "@/features/auth/stores/authStore"
import { queryClient } from "@/lib/queryClient"
import { useOrganizationStore } from "@/features/organizations/stores/organizationStore"

vi.mock("@/features/organizations/services/organization.service", () => ({
  getMembershipsForUser: vi.fn(),
}))

const { getMembershipsForUser } = await import(
  "@/features/organizations/services/organization.service"
)
const { requireOrganization, redirectIfOnboarded, requireMemberships } = await import(
  "@/features/organizations/lib/route-guards"
)

const ORG_A = {
  id: "m-1",
  role: { id: "r-1", name: "Owner" },
  status: "active" as const,
  organization: { id: "org-1", name: "Acme" },
}
const ORG_B = {
  id: "m-2",
  role: { id: "r-2", name: "Member" },
  status: "active" as const,
  organization: { id: "org-2", name: "Widgets Co" },
}

function isRedirectTo(error: unknown, path: string) {
  return (
    error instanceof Response &&
    error.status === 302 &&
    error.headers.get("Location") === path
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  queryClient.clear()
  useAuthStore.setState({
    session: { user: { id: "user-1" } } as never,
    status: "authenticated",
  })
  useOrganizationStore.setState({ currentOrganizationId: null })
})

describe("requireOrganization", () => {
  it("redirects to /login when there is no session", async () => {
    useAuthStore.setState({ session: null, status: "unauthenticated" })

    await expect(requireOrganization()).rejects.toSatisfy((error: unknown) =>
      isRedirectTo(error, "/login")
    )
  })

  it("redirects to /onboarding when the user has no memberships", async () => {
    vi.mocked(getMembershipsForUser).mockResolvedValue([])

    await expect(requireOrganization()).rejects.toSatisfy((error: unknown) =>
      isRedirectTo(error, "/onboarding")
    )
  })

  it("redirects to /select-organization when the user has memberships but nothing selected this session", async () => {
    vi.mocked(getMembershipsForUser).mockResolvedValue([ORG_A, ORG_B])

    await expect(requireOrganization()).rejects.toSatisfy((error: unknown) =>
      isRedirectTo(error, "/select-organization")
    )
  })

  it("redirects to /select-organization when the selected org is no longer one of the user's memberships", async () => {
    vi.mocked(getMembershipsForUser).mockResolvedValue([ORG_A])
    useOrganizationStore.setState({ currentOrganizationId: "org-stale" })

    await expect(requireOrganization()).rejects.toSatisfy((error: unknown) =>
      isRedirectTo(error, "/select-organization")
    )
  })

  it("resolves when the user has a valid selected organization", async () => {
    vi.mocked(getMembershipsForUser).mockResolvedValue([ORG_A, ORG_B])
    useOrganizationStore.setState({ currentOrganizationId: "org-2" })

    await expect(requireOrganization()).resolves.toBeNull()
  })

  it("redirects to /select-organization when the selected membership has been suspended", async () => {
    const suspended = { ...ORG_A, status: "suspended" as const }
    vi.mocked(getMembershipsForUser).mockResolvedValue([suspended])
    useOrganizationStore.setState({ currentOrganizationId: suspended.organization.id })

    await expect(requireOrganization()).rejects.toSatisfy((error: unknown) =>
      isRedirectTo(error, "/select-organization")
    )
  })
})

describe("redirectIfOnboarded", () => {
  it("redirects to / when the user already has a membership", async () => {
    vi.mocked(getMembershipsForUser).mockResolvedValue([ORG_A])

    await expect(redirectIfOnboarded()).rejects.toSatisfy((error: unknown) =>
      isRedirectTo(error, "/")
    )
  })

  it("resolves when the user has no memberships yet", async () => {
    vi.mocked(getMembershipsForUser).mockResolvedValue([])

    await expect(redirectIfOnboarded()).resolves.toBeNull()
  })
})

describe("requireMemberships", () => {
  it("redirects to /onboarding when the user has no memberships", async () => {
    vi.mocked(getMembershipsForUser).mockResolvedValue([])

    await expect(requireMemberships()).rejects.toSatisfy((error: unknown) =>
      isRedirectTo(error, "/onboarding")
    )
  })

  it("returns the membership list when the user has at least one", async () => {
    vi.mocked(getMembershipsForUser).mockResolvedValue([ORG_A, ORG_B])

    await expect(requireMemberships()).resolves.toEqual([ORG_A, ORG_B])
  })
})
