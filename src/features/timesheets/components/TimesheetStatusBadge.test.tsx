import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { TimesheetStatusBadge } from "@/features/timesheets/components/TimesheetStatusBadge"

describe("TimesheetStatusBadge", () => {
  it("renders Draft for draft", () => {
    render(<TimesheetStatusBadge status="draft" />)
    expect(screen.getByText("Draft")).toBeInTheDocument()
  })

  it("renders Submitted for submitted", () => {
    render(<TimesheetStatusBadge status="submitted" />)
    expect(screen.getByText("Submitted")).toBeInTheDocument()
  })

  it("renders Approved for approved", () => {
    render(<TimesheetStatusBadge status="approved" />)
    expect(screen.getByText("Approved")).toBeInTheDocument()
  })

  it("renders Rejected for rejected", () => {
    render(<TimesheetStatusBadge status="rejected" />)
    expect(screen.getByText("Rejected")).toBeInTheDocument()
  })
})
