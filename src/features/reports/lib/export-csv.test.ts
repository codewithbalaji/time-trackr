import { afterEach, describe, expect, it, vi } from "vitest"

import { buildCsv, downloadCsv } from "@/features/reports/lib/export-csv"

describe("buildCsv", () => {
  it("builds a header row plus one row per input, comma-joined", () => {
    const csv = buildCsv(
      [
        { project: "Website", duration: "01:30:00" },
        { project: "Internal", duration: "00:45:00" },
      ],
      [
        { key: "project", header: "Project" },
        { key: "duration", header: "Duration" },
      ]
    )

    expect(csv).toBe("Project,Duration\r\nWebsite,01:30:00\r\nInternal,00:45:00")
  })

  it("quotes and escapes values containing commas, quotes, or newlines", () => {
    const csv = buildCsv(
      [{ description: 'Client said "hi", then left\nmid-call' }],
      [{ key: "description", header: "Description" }]
    )

    expect(csv).toBe('Description\r\n"Client said ""hi"", then left\nmid-call"')
  })

  it("renders an undefined value as an empty cell", () => {
    const csv = buildCsv([{ description: undefined as unknown as string }], [
      { key: "description", header: "Description" },
    ])
    expect(csv).toBe("Description\r\n")
  })

  it("returns just the header row for an empty rows array", () => {
    expect(buildCsv([], [{ key: "project", header: "Project" }])).toBe("Project")
  })
})

describe("downloadCsv", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("creates an object URL, clicks a temporary anchor, then revokes the URL", () => {
    const createObjectURL = vi.fn(() => "blob:mock-url")
    const revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL

    const click = vi.fn()
    const appendChildSpy = vi.spyOn(document.body, "appendChild")
    const removeChildSpy = vi.spyOn(document.body, "removeChild")
    const createElementSpy = vi.spyOn(document, "createElement")

    downloadCsv("time-report_2026-08-25_to_2026-09-01.csv", "a,b\r\n1,2")

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(createElementSpy).toHaveBeenCalledWith("a")
    const anchor = createElementSpy.mock.results[0]!.value as HTMLAnchorElement
    expect(anchor.download).toBe("time-report_2026-08-25_to_2026-09-01.csv")
    expect(appendChildSpy).toHaveBeenCalledWith(anchor)
    expect(removeChildSpy).toHaveBeenCalledWith(anchor)
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url")
    void click
  })
})
