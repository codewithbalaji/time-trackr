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

  it("maps the rate-limit and account-state codes users actually hit", () => {
    expect(mapAuthError(makeError("over_request_rate_limit"))).toBe(
      "Too many attempts. Please wait a few minutes and try again."
    )
    expect(mapAuthError(makeError("user_banned"))).toBe(
      "This account has been suspended. Contact your administrator."
    )
    expect(mapAuthError(makeError("otp_expired"))).toBe(
      "That link has expired. Request a new one."
    )
  })

  it("distinguishes a network failure from a server error", () => {
    // fetch() rejects with a bare TypeError when the browser is offline or the
    // request is blocked. It used to be indistinguishable from a 500.
    expect(mapAuthError(new TypeError("Failed to fetch"))).toBe(
      "Couldn't reach the server. Check your connection and try again."
    )
  })

  it("falls back to a generic message for unknown codes", () => {
    expect(mapAuthError(makeError("some_unmapped_code"))).toBe(
      "Something went wrong. Please try again."
    )
  })

  it("survives an error that isn't an AuthError at all", () => {
    expect(mapAuthError(undefined)).toBe("Something went wrong. Please try again.")
    expect(mapAuthError(new Error("boom"))).toBe("Something went wrong. Please try again.")
  })
})
