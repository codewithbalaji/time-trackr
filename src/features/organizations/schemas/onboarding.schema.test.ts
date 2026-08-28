import { describe, expect, it } from "vitest"

import { onboardingSchema } from "@/features/organizations/schemas/onboarding.schema"

describe("onboardingSchema", () => {
  it("accepts a valid full name and organization name", () => {
    const result = onboardingSchema.safeParse({
      fullName: "Jane Doe",
      organizationName: "Acme Inc",
    })
    expect(result.success).toBe(true)
  })

  it("rejects an empty full name", () => {
    const result = onboardingSchema.safeParse({
      fullName: "",
      organizationName: "Acme Inc",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["fullName"])
    }
  })

  it("rejects an empty organization name", () => {
    const result = onboardingSchema.safeParse({
      fullName: "Jane Doe",
      organizationName: "",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["organizationName"])
    }
  })

  it("rejects an organization name over 120 characters", () => {
    const result = onboardingSchema.safeParse({
      fullName: "Jane Doe",
      organizationName: "a".repeat(121),
    })
    expect(result.success).toBe(false)
  })
})
