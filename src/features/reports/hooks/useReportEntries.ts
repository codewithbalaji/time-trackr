import { useQuery } from "@tanstack/react-query"

import { listOwnEntriesInRange } from "@/features/reports/services/report.service"
import { reportKeys } from "@/features/reports/lib/query-keys"
import type { DateRange } from "@/features/reports/lib/date-range-presets"
import { getRangeUtcBounds } from "@/features/timesheets/lib/week"

// The signed-in user's own time entries within a report date range.
export function useReportEntries(
  organizationId: string | undefined,
  userId: string | undefined,
  range: DateRange | undefined,
  timezone: string | undefined
) {
  return useQuery({
    queryKey: reportKeys.ownEntries(organizationId, userId, range?.start, range?.end),
    queryFn: () => {
      const { startIso, endIso } = getRangeUtcBounds(range!.start, range!.end, timezone!)
      return listOwnEntriesInRange(organizationId!, userId!, startIso, endIso)
    },
    enabled: !!organizationId && !!userId && !!range && !!timezone,
  })
}
