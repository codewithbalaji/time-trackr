import { describe, expect, it } from "vitest"

import { resetPasswordSchema } from "@/features/auth/schemas/reset-password.schema"

describe("resetPasswordSchema", () => {
  it("accepts a strong matching password", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Password1",
      confirmPassword: "Password1",
    })
    expect(result.success).toBe(true)
  })

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Password1",
      confirmPassword: "Password2",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a weak password", () => {
    const result = resetPasswordSchema.safeParse({
      password: "password",
      confirmPassword: "password",
    })
    expect(result.success).toBe(false)
  })
})
