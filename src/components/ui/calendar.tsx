"use client"

import * as React from "react"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  DayPicker,
  getDefaultClassNames,
  useDayPicker,
  type Modifiers,
  type MonthCaptionProps,
  type NavProps,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Hand-authored against react-day-picker v10 (no shadcn CLI available in this
// sandbox — see docs/decisions/0006-phase9-client-side-report-aggregation.md).
// Audited against DESIGN.md: no box-shadow anywhere, a subtle bg-accent tint
// (not Ledger Blue) connects the days *within* a range, Ledger Blue is
// reserved for the two range endpoints only (rounded-full pills) per "The
// One Accent Rule", and every color reads from the existing CSS variables in
// src/index.css rather than being hard-coded. Day cells are size-9 (36px)
// for comfortable tap/click targets and clearly readable numerals.
//
// Each visible month gets its own Month/Year dropdown pair (built from the
// themeable Radix-based Select, not a native <select> — a native select's
// browser-rendered option list can't be themed to match the app). Because
// react-day-picker anchors all visible months to one shared "first month"
// state, the two panels can't just call goToMonth(pickedMonth) independently
// — the right panel's dropdown has to set the anchor one month *behind* what
// it wants to display (see MonthYearDropdown's displayIndex handling below),
// so picking a range like Oct 2025 to Sep 2026 is a couple of dropdown
// selections instead of ~11 clicks through a plain prev/next nav.
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  labels,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("relative", className)}
      classNames={{
        root: cn("relative", defaultClassNames.root),
        months: cn(
          "flex flex-col gap-6 sm:flex-row sm:divide-x sm:divide-border",
          defaultClassNames.months
        ),
        month: cn("flex flex-col gap-3 sm:first:pr-6 sm:last:pl-6", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between",
          defaultClassNames.nav
        ),
        month_caption: cn(
          // px-7 keeps the dropdown pair clear of the absolutely-positioned
          // Nav's prev/next buttons, which sit flush against the outer
          // edges of the whole (two-month) row at this same height.
          "flex h-8 items-center justify-center gap-1.5 px-7",
          defaultClassNames.month_caption
        ),
        month_grid: cn("mt-2 w-full", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "w-9 pb-1 text-center text-xs font-medium text-muted-foreground",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full [&:not(:first-child)]:mt-0.5", defaultClassNames.week),
        day: cn(
          "relative size-9 p-0 text-center align-middle text-sm",
          "[&:has([data-selected])]:bg-accent",
          "[&:has([data-range-start])]:rounded-l-full",
          "[&:has([data-range-end])]:rounded-r-full",
          "[&:has([data-range-middle])]:rounded-none",
          // In-progress preview (hovering a potential end date before the
          // range is committed) reuses the same connecting-strip mechanics
          // as a committed range, but at lower opacity so it reads as
          // tentative — see the DayButton preview modifiers below.
          "[&:has([data-range-preview])]:bg-accent/60",
          "[&:has([data-range-preview-start])]:rounded-l-full",
          "[&:has([data-range-preview-end])]:rounded-r-full",
          defaultClassNames.day
        ),
        range_start: cn(defaultClassNames.range_start),
        range_middle: cn(defaultClassNames.range_middle),
        range_end: cn(defaultClassNames.range_end),
        today: cn(defaultClassNames.today),
        outside: cn("text-muted-foreground/40", defaultClassNames.outside),
        disabled: cn("text-muted-foreground/30 opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Nav: SingleStepNav,
        MonthCaption: MonthYearDropdown,
        DayButton: (props) => {
          const { className: dayButtonClassName, day, modifiers, ...dayButtonProps } = props
          void day // required by react-day-picker's DayButtonProps, unused here

          // In range mode react-day-picker marks every day inside the range
          // (start, middle, end) as `selected` — painting all of them solid
          // Ledger Blue read as one cramped block with hard-to-read numerals.
          // Only the two endpoints get the solid pill; the connecting bg
          // (see the `day`/td classes above) is a quiet bg-accent tint, and
          // middle days keep normal foreground text so numbers stay legible.
          const isRangeEndpoint = modifiers.range_start || modifiers.range_end
          const isRangeMiddle = modifiers.range_middle
          const isPlainSelected = modifiers.selected && !isRangeEndpoint && !isRangeMiddle

          // Custom modifiers set by DateRangePicker while a "from" date is
          // picked and the pointer is hovering a candidate "to" date — see
          // the `modifiers` prop passed alongside `onDayMouseEnter`/`Leave`
          // there. Kept as an outline, never a solid fill, so a preview can
          // never be mistaken for a committed selection.
          const isRangePreviewEnd = Boolean(modifiers.rangePreviewEnd)
          const isRangePreviewMiddle = Boolean(modifiers.inRangePreview)

          return (
            <button
              type="button"
              data-selected={modifiers.selected || undefined}
              data-range-start={modifiers.range_start || undefined}
              data-range-end={modifiers.range_end || undefined}
              data-range-middle={modifiers.range_middle || undefined}
              data-range-preview={
                isRangePreviewMiddle || isRangePreviewEnd ? true : undefined
              }
              data-range-preview-start={modifiers.rangePreviewStart || undefined}
              data-range-preview-end={isRangePreviewEnd || undefined}
              className={cn(
                "relative flex size-9 items-center justify-center rounded-full p-0 text-sm font-normal text-foreground transition-colors outline-none",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-popover",
                "disabled:pointer-events-none disabled:opacity-40 disabled:hover:bg-transparent",
                modifiers.outside && "text-muted-foreground/40",
                isRangeMiddle && "rounded-none font-medium hover:bg-primary/15",
                (isRangeEndpoint || isPlainSelected) &&
                  "bg-primary font-semibold text-primary-foreground hover:bg-primary/85",
                isRangePreviewEnd &&
                  !modifiers.selected &&
                  "rounded-full font-semibold outline-1 outline-dashed outline-primary/60 outline-offset-1",
                dayButtonClassName
              )}
              {...dayButtonProps}
            >
              {dayButtonProps.children}
              {modifiers.today && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full",
                    isRangeEndpoint || isPlainSelected ? "bg-primary-foreground" : "bg-primary"
                  )}
                />
              )}
            </button>
          )
        },
      }}
      labels={{ labelDayButton, ...labels }}
      {...props}
    />
  )
}

// Extends react-day-picker's default label ("<date>, selected") with which
// end of the range a day is, since sighted users get that distinction from
// the solid-vs-connecting-strip styling but screen reader users otherwise
// only hear "selected" for every day in the range.
function labelDayButton(date: Date, modifiers: Modifiers): string {
  let label = format(date, "PPPP")
  if (modifiers.today) label = `Today, ${label}`
  if (modifiers.range_start) label = `${label}, start of selected range`
  else if (modifiers.range_end) label = `${label}, end of selected range`
  else if (modifiers.range_middle) label = `${label}, in selected range`
  else if (modifiers.selected) label = `${label}, selected`
  if (modifiers.disabled) label = `${label}, disabled`
  return label
}

const navButtonClass = cn(
  buttonVariants({ variant: "ghost", size: "icon-sm" }),
  "text-muted-foreground hover:text-foreground"
)

function SingleStepNav({
  className,
  onPreviousClick,
  onNextClick,
  previousMonth,
  nextMonth,
  ...navProps
}: NavProps) {
  void navProps

  return (
    // pointer-events-none on the row itself: it spans the full width (both
    // months) so its two buttons can sit at the outer edges, but without
    // this the empty middle of the row would sit on top of the Month/Year
    // dropdowns below and swallow clicks meant for them.
    <nav className={cn("pointer-events-none flex items-center justify-between", className)}>
      <button
        type="button"
        aria-label="Previous month"
        className={cn(navButtonClass, "pointer-events-auto")}
        disabled={!previousMonth}
        onClick={onPreviousClick}
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Next month"
        className={cn(navButtonClass, "pointer-events-auto")}
        disabled={!nextMonth}
        onClick={onNextClick}
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}

const monthDropdownTriggerClass = cn(
  "h-7 gap-1 rounded-md border-none bg-transparent px-1.5 text-sm font-semibold text-foreground hover:bg-accent"
)

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, month) => ({
  value: month,
  label: format(new Date(2000, month, 1), "MMMM"),
}))

// One Month + one Year Select per visible month panel, replacing the plain
// text caption. react-day-picker only tracks a single anchor month (the
// first visible month); every other visible month is derived as anchor +
// displayIndex. So the left panel's (displayIndex 0) dropdowns can call
// goToMonth(picked) directly, but the right panel's (displayIndex 1)
// dropdowns must set the anchor one month *behind* the month they display,
// or picking a month there would silently move the left panel instead.
function MonthYearDropdown({
  calendarMonth,
  displayIndex,
  className,
  ...divProps
}: MonthCaptionProps) {
  const { goToMonth, dayPickerProps } = useDayPicker()
  const startBound = dayPickerProps.startMonth
  const endBound = dayPickerProps.endMonth
  const year = calendarMonth.date.getFullYear()
  const month = calendarMonth.date.getMonth()

  const firstYear = startBound?.getFullYear() ?? year - 10
  const lastYear = endBound?.getFullYear() ?? year + 10
  const yearOptions = Array.from(
    { length: lastYear - firstYear + 1 },
    (_, i) => firstYear + i
  )

  function applyAnchor(nextYear: number, nextMonth: number) {
    goToMonth(new Date(nextYear, nextMonth - displayIndex, 1))
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)} {...divProps}>
      <Select
        value={String(month)}
        onValueChange={(next) => applyAnchor(year, Number(next))}
      >
        <SelectTrigger size="sm" className={monthDropdownTriggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTH_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(year)}
        onValueChange={(next) => applyAnchor(Number(next), month)}
      >
        <SelectTrigger size="sm" className={monthDropdownTriggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export { Calendar }
