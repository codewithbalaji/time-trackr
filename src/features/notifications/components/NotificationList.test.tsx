import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { NotificationList } from "@/features/notifications/components/NotificationList"

describe("NotificationList", () => {
  it("shows a loading state", () => {
    render(
      <NotificationList notifications={undefined} isLoading organizationId="org-1" />
    )
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it("shows the default empty state when there are no notifications", () => {
    render(
      <NotificationList notifications={[]} isLoading={false} organizationId="org-1" />
    )
    expect(screen.getByText("You're all caught up.")).toBeInTheDocument()
  })

  it("shows a custom empty message when provided", () => {
    render(
      <NotificationList
        notifications={[]}
        isLoading={false}
        organizationId="org-1"
        emptyMessage="No notifications yet."
      />
    )
    expect(screen.getByText("No notifications yet.")).toBeInTheDocument()
  })
})
