import { describe, expect, it } from "vitest"

import { inviteSchema } from "@/features/organizations/schemas/invite.schema"

describe("inviteSchema", () => {
  it("accepts a valid email", () => {
    expect(inviteSchema.safeParse({ email: "teammate@example.com" }).success).toBe(true)
  })

  it("rejects an empty email", () => {
    const result = inviteSchema.safeParse({ email: "" })
    expect(result.success).toBe(false)
  })

  it("rejects a malformed email", () => {
    const result = inviteSchema.safeParse({ email: "not-an-email" })
    expect(result.success).toBe(false)
  })
})
