import { describe, expect, it } from "vitest"

import { clientSchema } from "@/features/clients/schemas/client.schema"

describe("clientSchema", () => {
  it("accepts a valid name", () => {
    const result = clientSchema.safeParse({ name: "Acme Corp" })
    expect(result.success).toBe(true)
  })

  it("rejects an empty name", () => {
    const result = clientSchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("Name is required")
  })

  it("rejects a name longer than 120 characters", () => {
    const result = clientSchema.safeParse({ name: "a".repeat(121) })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "Name must be 120 characters or fewer"
    )
  })
})
