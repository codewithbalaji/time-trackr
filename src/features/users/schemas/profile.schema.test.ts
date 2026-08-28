import { describe, expect, it } from "vitest"

import { profileSchema } from "@/features/users/schemas/profile.schema"

describe("profileSchema", () => {
  it("accepts a valid full name", () => {
    expect(profileSchema.safeParse({ fullName: "Jane Doe" }).success).toBe(true)
  })

  it("rejects an empty name", () => {
    expect(profileSchema.safeParse({ fullName: "" }).success).toBe(false)
  })

  it("rejects a name over 120 characters", () => {
    expect(profileSchema.safeParse({ fullName: "a".repeat(121) }).success).toBe(false)
  })
})
