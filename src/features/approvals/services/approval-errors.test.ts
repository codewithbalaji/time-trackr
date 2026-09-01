import { describe, expect, it } from "vitest"
import type { PostgrestError } from "@supabase/supabase-js"

import { mapApprovalError } from "@/features/approvals/services/approval-errors"

function makeError(message: string, code = ""): PostgrestError {
  return {
    name: "PostgrestError",
    message,
    code,
    details: "",
    hint: "",
    toJSON: () => ({ name: "PostgrestError", message, code, details: "", hint: "" }),
  }
}

describe("mapApprovalError", () => {
  it("maps known RPC exception messages to user-facing text", () => {
    expect(mapApprovalError(makeError("insufficient_permissions"))).toBe(
      "You don't have permission to do that."
    )
    expect(mapApprovalError(makeError("not_pending_approval"))).toBe(
      "This timesheet is no longer awaiting review."
    )
    expect(mapApprovalError(makeError("rejection_reason_required"))).toBe(
      "Enter a reason for rejecting this timesheet."
    )
  })

  it("maps the Postgres permission-denied code", () => {
    expect(mapApprovalError(makeError("some message", "42501"))).toBe(
      "You don't have permission to do that."
    )
  })

  it("falls back to a generic message for unknown errors", () => {
    expect(mapApprovalError(makeError("something else", "99999"))).toBe(
      "Something went wrong. Please try again."
    )
  })
})
