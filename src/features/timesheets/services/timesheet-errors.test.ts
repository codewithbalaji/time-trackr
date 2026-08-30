import { describe, expect, it } from "vitest"
import type { PostgrestError } from "@supabase/supabase-js"

import { mapTimesheetError } from "@/features/timesheets/services/timesheet-errors"

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

describe("mapTimesheetError", () => {
  it("maps known RPC exception messages to user-facing text", () => {
    expect(mapTimesheetError(makeError("timer_running"))).toBe(
      "Stop your running timer before submitting this week."
    )
    expect(mapTimesheetError(makeError("timesheet_not_submitted"))).toBe(
      "This timesheet isn't submitted."
    )
  })

  it("falls back to a generic message for unknown errors", () => {
    expect(mapTimesheetError(makeError("something else", "99999"))).toBe(
      "Something went wrong. Please try again."
    )
  })
})
