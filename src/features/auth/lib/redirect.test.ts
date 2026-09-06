import { describe, expect, it } from "vitest"

import { safeRedirectPath } from "@/features/auth/lib/redirect"

describe("safeRedirectPath", () => {
  it("keeps a same-origin path", () => {
    expect(safeRedirectPath("/invite/accept?token=abc")).toBe("/invite/accept?token=abc")
  })

  it("falls back when the parameter is absent", () => {
    expect(safeRedirectPath(null)).toBe("/select-organization")
    expect(safeRedirectPath("")).toBe("/select-organization")
  })

  it("refuses anything that could leave the origin", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/select-organization")
    expect(safeRedirectPath("//evil.com")).toBe("/select-organization")
    // \ is a literal backslash — some browsers normalise "/\" to "//".
    expect(safeRedirectPath("/\u005Cevil.com")).toBe("/select-organization")
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/select-organization")
  })
})
