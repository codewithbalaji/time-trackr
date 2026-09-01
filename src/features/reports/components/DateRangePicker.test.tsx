import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DateRangePicker } from "@/features/reports/components/DateRangePicker"

describe("DateRangePicker", () => {
  it("shows the formatted range on the trigger button", () => {
    render(
      <DateRangePicker
        value={{ start: "2026-08-25", end: "2026-09-01" }}
        preset="this-week"
        onPresetChange={vi.fn()}
        onCustomChange={vi.fn()}
      />
    )
    expect(screen.getByRole("button", { name: /aug 25.*sep 1, 2026/i })).toBeInTheDocument()
  })

  it("shows both years on the trigger button when the range spans a year boundary", () => {
    render(
      <DateRangePicker
        value={{ start: "2025-08-31", end: "2026-09-06" }}
        preset="custom"
        onPresetChange={vi.fn()}
        onCustomChange={vi.fn()}
      />
    )
    expect(
      screen.getByRole("button", { name: /aug 31, 2025.*sep 6, 2026/i })
    ).toBeInTheDocument()
  })

  it("opens with the left calendar on the range's start month and the right on its end month, not today", async () => {
    const user = userEvent.setup()
    render(
      <DateRangePicker
        value={{ start: "2025-09-05", end: "2026-10-01" }}
        preset="custom"
        onPresetChange={vi.fn()}
        onCustomChange={vi.fn()}
      />
    )

    await user.click(screen.getByRole("button", { name: /sep 5, 2025.*oct 1, 2026/i }))

    expect(await screen.findByRole("grid", { name: "September 2025" })).toBeInTheDocument()
    expect(screen.getByRole("grid", { name: "October 2026" })).toBeInTheDocument()
  })

  it("commits a preset immediately when clicked", async () => {
    const user = userEvent.setup()
    const onPresetChange = vi.fn()
    render(
      <DateRangePicker
        value={{ start: "2026-08-25", end: "2026-09-01" }}
        preset="this-week"
        onPresetChange={onPresetChange}
        onCustomChange={vi.fn()}
      />
    )

    await user.click(screen.getByRole("button", { name: /aug 25.*sep 1, 2026/i }))
    await user.click(await screen.findByRole("button", { name: "Today" }))

    expect(onPresetChange).toHaveBeenCalledWith("today")
  })

  it("selecting a single day range via the calendar shows a same-day label", () => {
    render(
      <DateRangePicker
        value={{ start: "2026-08-27", end: "2026-08-27" }}
        preset="today"
        onPresetChange={vi.fn()}
        onCustomChange={vi.fn()}
      />
    )
    expect(screen.getByRole("button", { name: "Aug 27, 2026" })).toBeInTheDocument()
  })

  it("does not commit a custom range until Apply is clicked", async () => {
    const user = userEvent.setup()
    const onCustomChange = vi.fn()
    render(
      <DateRangePicker
        value={{ start: "2026-08-25", end: "2026-09-01" }}
        preset="this-week"
        onPresetChange={vi.fn()}
        onCustomChange={onCustomChange}
      />
    )

    await user.click(screen.getByRole("button", { name: /aug 25.*sep 1, 2026/i }))
    // The draft is seeded from the already-applied range, so Apply starts
    // enabled and Cancel must not report any change back to the caller.
    await user.click(await screen.findByRole("button", { name: "Cancel" }))

    expect(onCustomChange).not.toHaveBeenCalled()
  })

  it("commits the draft range when Apply is clicked", async () => {
    const user = userEvent.setup()
    const onCustomChange = vi.fn()
    render(
      <DateRangePicker
        value={{ start: "2026-08-25", end: "2026-09-01" }}
        preset="this-week"
        onPresetChange={vi.fn()}
        onCustomChange={onCustomChange}
      />
    )

    await user.click(screen.getByRole("button", { name: /aug 25.*sep 1, 2026/i }))
    await user.click(await screen.findByRole("button", { name: "Apply" }))

    expect(onCustomChange).toHaveBeenCalledWith({ start: "2026-08-25", end: "2026-09-01" })
  })
})
