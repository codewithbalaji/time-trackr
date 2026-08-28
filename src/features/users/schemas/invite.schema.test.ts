import { describe, expect, it } from "vitest"

import { inviteSchema } from "@/features/users/schemas/invite.schema"

describe("inviteSchema", () => {
  it("accepts a valid email and role", () => {
    expect(
      inviteSchema.safeParse({ email: "teammate@example.com", roleId: "role-1" }).success
    ).toBe(true)
  })

  it("rejects an empty email", () => {
    const result = inviteSchema.safeParse({ email: "", roleId: "role-1" })
    expect(result.success).toBe(false)
  })

  it("rejects a malformed email", () => {
    const result = inviteSchema.safeParse({ email: "not-an-email", roleId: "role-1" })
    expect(result.success).toBe(false)
  })

  it("rejects an empty role", () => {
    const result = inviteSchema.safeParse({ email: "teammate@example.com", roleId: "" })
    expect(result.success).toBe(false)
  })
})
