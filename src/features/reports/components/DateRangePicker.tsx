import { useRef, useState } from "react"
import { addMonths, format, isBefore, isSameDay } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange as DayPickerRange, Matcher } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DATE_RANGE_PRESETS,
  type DateRange,
  type DateRangePresetKey,
} from "@/features/reports/lib/date-range-presets"

// Bounds how far the year dropdown can jump — generous enough for a report
// looking back over past years without an unbounded (and unusable) list.
const currentYear = new Date().getFullYear()
const CALENDAR_START_MONTH = new Date(currentYear - 6, 0, 1)
const CALENDAR_END_MONTH = new Date(currentYear + 1, 11, 1)

// Shared by DashboardPage and ReportsPage — the one place a date range is
// picked in the app. Controlled by { value, preset } from useReportFilters.
// Presets commit immediately (one click, close). A custom range uses a local
// "draft" selection instead: the calendar always shows what you're actively
// building (even a single picked start date), and nothing is applied to the
// dashboard/report until you press Apply — so a multi-month drag (e.g. Oct
// 2025 to Sep 2026) doesn't silently commit a wrong range on a stray click.
export function DateRangePicker({
  value,
  preset,
  onPresetChange,
  onCustomChange,
}: {
  value: DateRange
  preset: DateRangePresetKey | "custom"
  onPresetChange: (key: DateRangePresetKey) => void
  onCustomChange: (range: DateRange) => void
}) {
  const [open, setOpenState] = useState(false)
  const [draft, setDraft] = useState<DayPickerRange | undefined>(() => toDayPickerRange(value))
  // Tracks the date under the pointer while a start date is picked but an
  // end date isn't yet, so the calendar can preview the range that a click
  // would produce (requirement: hover previews a potential end date).
  const [hoverDate, setHoverDate] = useState<Date | undefined>(undefined)
  const activePresetRef = useRef<HTMLButtonElement>(null)

  function setOpen(next: boolean) {
    // Re-seed the draft from the currently applied range every time the
    // popover opens, so a previous unapplied/cancelled selection never
    // leaks into the next visit, and Cancel always has a clean state to
    // fall back to.
    if (next) setDraft(toDayPickerRange(value))
    setHoverDate(undefined)
    setOpenState(next)
  }

  // Only relevant while a "from" is picked and a "to" isn't — once both
  // ends are set, the committed range/middle styling takes over and any
  // stale hover preview would just be visual noise on top of it.
  const previewActive = Boolean(draft?.from && !draft?.to && hoverDate)
  const previewFrom = previewActive && draft?.from && hoverDate && isBefore(hoverDate, draft.from)
    ? hoverDate
    : draft?.from
  const previewTo = previewActive && draft?.from && hoverDate && isBefore(hoverDate, draft.from)
    ? draft.from
    : hoverDate

  const rangePreviewModifiers: Record<string, Matcher> = {
    inRangePreview: (date: Date) =>
      Boolean(previewActive && previewFrom && previewTo && date > previewFrom && date < previewTo),
    rangePreviewStart: (date: Date) =>
      Boolean(previewActive && previewFrom && isSameDay(date, previewFrom)),
    rangePreviewEnd: (date: Date) =>
      Boolean(previewActive && hoverDate && isSameDay(date, hoverDate)),
  }

  function applyDraft() {
    if (draft?.from && draft?.to) {
      onCustomChange({ start: formatKey(draft.from), end: formatKey(draft.to) })
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarIcon className="size-4" data-icon="inline-start" />
          {formatRangeLabel(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex w-auto gap-0 p-0"
        onOpenAutoFocus={(event) => {
          // Radix would otherwise autofocus the first preset button ("Today"),
          // which reads as if "Today" were the active selection even when a
          // different preset (e.g. "This week") is actually applied.
          event.preventDefault()
          activePresetRef.current?.focus()
        }}
      >
        <div className="flex w-40 flex-col gap-0.5 border-r border-border p-3">
          {DATE_RANGE_PRESETS.map((item) => {
            const isActive = preset === item.key
            return (
              <Button
                key={item.key}
                ref={isActive ? activePresetRef : undefined}
                type="button"
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className="justify-start font-normal"
                onClick={() => {
                  onPresetChange(item.key)
                  setOpen(false)
                }}
              >
                {item.label}
              </Button>
            )
          })}
        </div>
        <div className="flex flex-col">
          <div className="flex divide-x divide-border">
            {/* Two independent single-month calendars, not one linked
                two-month view: the left panel always anchors on the "from"
                date, the right on "to" — which, for a range spanning many
                months (e.g. Aug 2025 to Sep 2026), are not adjacent months.
                Both share the same `selected`/`onSelect` draft, so a click in
                either panel extends the same range. */}
            <div className="p-4" role="group" aria-labelledby="date-range-start-label">
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase" id="date-range-start-label">
                Start
              </p>
              <Calendar
                mode="range"
                selected={draft}
                onSelect={(range) => {
                  setDraft(range)
                  setHoverDate(undefined)
                }}
                onDayMouseEnter={setHoverDate}
                onDayMouseLeave={() => setHoverDate(undefined)}
                modifiers={rangePreviewModifiers}
                numberOfMonths={1}
                defaultMonth={draft?.from}
                startMonth={CALENDAR_START_MONTH}
                endMonth={CALENDAR_END_MONTH}
              />
            </div>
            <div className="p-4" role="group" aria-labelledby="date-range-end-label">
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase" id="date-range-end-label">
                End
              </p>
              <Calendar
                mode="range"
                selected={draft}
                onSelect={(range) => {
                  setDraft(range)
                  setHoverDate(undefined)
                }}
                onDayMouseEnter={setHoverDate}
                onDayMouseLeave={() => setHoverDate(undefined)}
                modifiers={rangePreviewModifiers}
                numberOfMonths={1}
                defaultMonth={draft?.to ?? addMonths(draft?.from ?? new Date(), 1)}
                startMonth={CALENDAR_START_MONTH}
                endMonth={CALENDAR_END_MONTH}
              />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            {/* Explicit "Start"/"End" labels (not just an arrow between two
                dates) so which end of the range each date belongs to is
                never a guess — aria-live announces the draft as it's built,
                since sighted users get the same info from the calendar's
                own selected/preview styling. */}
            <div className="flex items-baseline gap-4 text-xs" aria-live="polite">
              {!draft?.from ? (
                <span className="text-muted-foreground">Pick a start and end date</span>
              ) : (
                <>
                  <span className="text-muted-foreground">
                    Start{" "}
                    <span className="font-medium text-foreground">
                      {format(draft.from, "MMM d, yyyy")}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    End{" "}
                    <span
                      className={cn(
                        "font-medium",
                        draft.to ? "text-foreground" : "text-muted-foreground italic"
                      )}
                    >
                      {draft.to ? format(draft.to, "MMM d, yyyy") : "pick a date"}
                    </span>
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!draft?.from || !draft?.to}
                onClick={applyDraft}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function formatKey(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`)
}

function toDayPickerRange(range: DateRange): DayPickerRange {
  return { from: parseDateKey(range.start), to: parseDateKey(range.end) }
}

function formatRangeLabel(range: DateRange): string {
  const start = parseDateKey(range.start)
  const end = parseDateKey(range.end)
  if (range.start === range.end) return format(start, "MMM d, yyyy")
  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonthAndYear = sameYear && start.getMonth() === end.getMonth()
  return `${format(start, sameYear ? "MMM d" : "MMM d, yyyy")} → ${format(end, sameMonthAndYear ? "d, yyyy" : "MMM d, yyyy")}`
}
