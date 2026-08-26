import { describe, expect, it } from "vitest"
import type { AuthError } from "@supabase/supabase-js"

import { mapAuthError } from "@/features/auth/services/auth-errors"

function makeError(code: string): AuthError {
  return { name: "AuthApiError", message: "irrelevant", code } as AuthError
}

describe("mapAuthError", () => {
  it("maps known codes to user-facing messages", () => {
    expect(mapAuthError(makeError("invalid_credentials"))).toBe(
      "Incorrect email or password."
    )
    expect(mapAuthError(makeError("email_not_confirmed"))).toBe(
      "Please verify your email before signing in."
    )
  })

  it("falls back to a generic message for unknown codes", () => {
    expect(mapAuthError(makeError("some_unmapped_code"))).toBe(
      "Something went wrong. Please try again."
    )
  })
})
