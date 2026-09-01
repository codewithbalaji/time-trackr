import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AuditLogList } from "@/features/audit/components/AuditLogList"
import type { AuditLogEntry } from "@/features/audit/services/audit.service"

describe("AuditLogList", () => {
  it("shows a loading state", () => {
    render(<AuditLogList entries={undefined} isLoading />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it("shows an empty state when there are no entries", () => {
    render(<AuditLogList entries={[]} isLoading={false} />)
    expect(screen.getByText("No activity yet")).toBeInTheDocument()
  })

  it("renders an entry with its actor, action, and target", () => {
    const entries: AuditLogEntry[] = [
      {
        id: "log-1",
        created_at: new Date().toISOString(),
        actor: { full_name: "Ana Owner", email: "ana@example.com" },
        action: "organizations_updated",
        target_type: "organizations",
        target_id: "org-1",
        metadata: {},
      },
    ]
    render(<AuditLogList entries={entries} isLoading={false} />)
    expect(screen.getByText("Ana Owner")).toBeInTheDocument()
    expect(screen.getByText("Updated")).toBeInTheDocument()
    expect(screen.getByText("organization")).toBeInTheDocument()
  })

  it("shows System as the actor when actor is null", () => {
    const entries: AuditLogEntry[] = [
      {
        id: "log-1",
        created_at: new Date().toISOString(),
        actor: null,
        action: "role_assigned",
        target_type: "memberships",
        target_id: "membership-1",
        metadata: {},
      },
    ]
    render(<AuditLogList entries={entries} isLoading={false} />)
    expect(screen.getByText("System")).toBeInTheDocument()
    expect(screen.getByText("Role assigned")).toBeInTheDocument()
  })
})
