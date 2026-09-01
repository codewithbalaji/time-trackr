import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ReportFilterBar } from "@/features/reports/components/ReportFilterBar"

const BASE_PROPS = {
  range: { start: "2026-08-24", end: "2026-08-30" },
  preset: "this-week" as const,
  onPresetChange: vi.fn(),
  onCustomRangeChange: vi.fn(),
  projects: [],
  clients: [],
  members: [
    {
      id: "member-1",
      role: { id: "role-1", name: "Member" },
      status: "active" as const,
      created_at: "2026-01-01T00:00:00.000Z",
      profile: { id: "user-1", full_name: "Ana Reviewer", email: "ana@example.com" },
    },
  ],
  projectId: null,
  clientId: null,
  userId: null,
  onProjectChange: vi.fn(),
  onClientChange: vi.fn(),
  onUserChange: vi.fn(),
}

// The member filter is a UX convenience gated by useHasPermission at the call
// site (see ReportsPage) — this test only covers that ReportFilterBar itself
// honors the `showMemberFilter` prop it's handed, not the permission check.
describe("ReportFilterBar", () => {
  it("hides the member filter when showMemberFilter is false", () => {
    render(<ReportFilterBar {...BASE_PROPS} showMemberFilter={false} />)
    expect(screen.queryByText("All members")).not.toBeInTheDocument()
  })

  it("shows the member filter when showMemberFilter is true", () => {
    render(<ReportFilterBar {...BASE_PROPS} showMemberFilter />)
    expect(screen.getByText("All members")).toBeInTheDocument()
  })
})
