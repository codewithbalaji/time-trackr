import { describe, expect, it } from "vitest"

import { emailSchema } from "@/features/auth/schemas/email"

describe("emailSchema", () => {
  it("trims and lowercases, so the same address is the same account", () => {
    // React Hook Form hands over exactly what was typed, and " User@x.com "
    // reached GoTrue verbatim — a different address from the one the account
    // was created under.
    const result = emailSchema.safeParse("  User@Example.COM  ")
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe("user@example.com")
  })

  it("rejects an empty or whitespace-only value", () => {
    expect(emailSchema.safeParse("").success).toBe(false)
    expect(emailSchema.safeParse("   ").success).toBe(false)
  })

  it("rejects a malformed address", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false)
  })
})
