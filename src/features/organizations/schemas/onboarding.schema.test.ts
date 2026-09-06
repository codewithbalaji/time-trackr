import { describe, expect, it } from "vitest"

import { onboardingSchema } from "@/features/organizations/schemas/onboarding.schema"

describe("onboardingSchema", () => {
  it("accepts an organization name", () => {
    const result = onboardingSchema.safeParse({ organizationName: "Acme Inc" })
    expect(result.success).toBe(true)
  })

  it("rejects an empty organization name", () => {
    const result = onboardingSchema.safeParse({ organizationName: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["organizationName"])
    }
  })

  it("rejects a whitespace-only organization name", () => {
    // Used to pass here and fail at the database's char_length(trim(name))
    // check instead, surfacing as a generic toast rather than a field error.
    const result = onboardingSchema.safeParse({ organizationName: "   " })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["organizationName"])
    }
  })

  it("trims surrounding whitespace off the organization name", () => {
    const result = onboardingSchema.safeParse({ organizationName: "  Acme Inc  " })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.organizationName).toBe("Acme Inc")
    }
  })

  it("rejects an organization name over 120 characters", () => {
    const result = onboardingSchema.safeParse({ organizationName: "a".repeat(121) })
    expect(result.success).toBe(false)
  })
})
