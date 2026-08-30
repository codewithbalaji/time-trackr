import { TableCell } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatDuration } from "@/features/time-tracking/lib/format-duration"

export function TimesheetDayCell({ seconds, onClick }: { seconds: number; onClick: () => void }) {
  return (
    <TableCell
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick()
        }
      }}
      className={cn(
        "cursor-pointer text-right font-mono text-sm tabular-nums hover:bg-muted",
        seconds === 0 && "text-muted-foreground"
      )}
    >
      {seconds > 0 ? formatDuration(seconds) : "–"}
    </TableCell>
  )
}
