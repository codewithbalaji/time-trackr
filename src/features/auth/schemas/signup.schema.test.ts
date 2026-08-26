import { describe, expect, it } from "vitest"

import { signupSchema } from "@/features/auth/schemas/signup.schema"

const validInput = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  password: "Password1",
  confirmPassword: "Password1",
}

describe("signupSchema", () => {
  it("accepts a valid signup", () => {
    expect(signupSchema.safeParse(validInput).success).toBe(true)
  })

  it("rejects a password shorter than 8 characters", () => {
    const result = signupSchema.safeParse({
      ...validInput,
      password: "Pass1",
      confirmPassword: "Pass1",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a password missing a digit", () => {
    const result = signupSchema.safeParse({
      ...validInput,
      password: "Password",
      confirmPassword: "Password",
    })
    expect(result.success).toBe(false)
  })

  it("rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({
      ...validInput,
      confirmPassword: "Different1",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("confirmPassword")
    }
  })

  it("rejects a missing full name", () => {
    const result = signupSchema.safeParse({ ...validInput, fullName: "" })
    expect(result.success).toBe(false)
  })
})
