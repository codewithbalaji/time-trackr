import { describe, expect, it } from "vitest"

import { inviteAcceptSchema } from "@/features/organizations/schemas/invite-accept.schema"

describe("inviteAcceptSchema", () => {
  it("accepts a valid name and matching passwords", () => {
    const result = inviteAcceptSchema.safeParse({
      fullName: "Jane Doe",
      password: "Password1",
      confirmPassword: "Password1",
    })
    expect(result.success).toBe(true)
  })

  it("rejects mismatched passwords", () => {
    const result = inviteAcceptSchema.safeParse({
      fullName: "Jane Doe",
      password: "Password1",
      confirmPassword: "Password2",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"])
    }
  })

  it("rejects a weak password", () => {
    const result = inviteAcceptSchema.safeParse({
      fullName: "Jane Doe",
      password: "short",
      confirmPassword: "short",
    })
    expect(result.success).toBe(false)
  })
})
