import { describe, expect, it } from "vitest"

import { projectSchema } from "@/features/projects/schemas/project.schema"

const validInput = {
  name: "Website Redesign",
  clientId: null,
  color: "#3B82F6",
  description: "",
}

describe("projectSchema", () => {
  it("accepts a valid project", () => {
    expect(projectSchema.safeParse(validInput).success).toBe(true)
  })

  it("accepts a project with a client assigned", () => {
    const result = projectSchema.safeParse({ ...validInput, clientId: "client-1" })
    expect(result.success).toBe(true)
  })

  it("rejects an empty name", () => {
    const result = projectSchema.safeParse({ ...validInput, name: "" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("Name is required")
  })

  it("rejects an invalid hex color", () => {
    const result = projectSchema.safeParse({ ...validInput, color: "blue" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("Enter a valid hex color")
  })

  it("rejects a description over 2000 characters", () => {
    const result = projectSchema.safeParse({ ...validInput, description: "a".repeat(2001) })
    expect(result.success).toBe(false)
  })
})
