import { useQuery } from "@tanstack/react-query"

import { listEntriesForPeriod } from "@/features/timesheets/services/timesheet.service"
import { timesheetKeys } from "@/features/timesheets/lib/query-keys"
import { getPeriodUtcBounds } from "@/features/timesheets/lib/week"

export function useTimeEntriesForPeriod(
  organizationId: string | undefined,
  userId: string | undefined,
  periodStart: string | undefined,
  timezone: string | undefined
) {
  return useQuery({
    queryKey: timesheetKeys.entries(organizationId, userId, periodStart),
    queryFn: () => {
      const { startIso, endIso } = getPeriodUtcBounds(periodStart!, timezone!)
      return listEntriesForPeriod(organizationId!, userId!, startIso, endIso)
    },
    enabled: !!organizationId && !!userId && !!periodStart && !!timezone,
  })
}
