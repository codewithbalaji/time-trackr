import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatWeekRange, getWeekStart, shiftWeek } from "@/features/timesheets/lib/week"

export function WeekNavigator({
  periodStart,
  timezone,
  onChange,
}: {
  periodStart: string
  timezone: string
  onChange: (periodStart: string) => void
}) {
  const isCurrentWeek = periodStart === getWeekStart(new Date(), timezone)

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Previous week"
        onClick={() => onChange(shiftWeek(periodStart, -1))}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-40 text-center text-sm font-medium">
        {formatWeekRange(periodStart)}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Next week"
        onClick={() => onChange(shiftWeek(periodStart, 1))}
      >
        <ChevronRight className="size-4" />
      </Button>
      {!isCurrentWeek && (
        <Button variant="ghost" size="sm" onClick={() => onChange(getWeekStart(new Date(), timezone))}>
          This week
        </Button>
      )}
    </div>
  )
}
