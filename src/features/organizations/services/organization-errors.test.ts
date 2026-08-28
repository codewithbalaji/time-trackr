import { describe, expect, it } from "vitest"
import type { PostgrestError } from "@supabase/supabase-js"

import { mapOrganizationError } from "@/features/organizations/services/organization-errors"

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

describe("mapOrganizationError", () => {
  it("maps known RPC exception messages to user-facing text", () => {
    expect(mapOrganizationError(makeError("invitation_not_found"))).toBe(
      "This invitation link is invalid."
    )
    expect(mapOrganizationError(makeError("invitation_expired"))).toBe(
      "This invitation has expired. Ask the organization owner to send a new one."
    )
  })

  it("maps a unique-violation code when the message doesn't match", () => {
    expect(mapOrganizationError(makeError("duplicate key value", "23505"))).toBe(
      "There's already a pending invitation for this email."
    )
  })

  it("falls back to a generic message for unknown errors", () => {
    expect(mapOrganizationError(makeError("something else", "99999"))).toBe(
      "Something went wrong. Please try again."
    )
  })
})
