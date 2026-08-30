import { useQuery } from "@tanstack/react-query"

import { getTimesheet } from "@/features/timesheets/services/timesheet.service"
import { timesheetKeys } from "@/features/timesheets/lib/query-keys"

export function useTimesheet(
  organizationId: string | undefined,
  userId: string | undefined,
  periodStart: string | undefined
) {
  return useQuery({
    queryKey: timesheetKeys.detail(organizationId, userId, periodStart),
    queryFn: () => getTimesheet(organizationId!, userId!, periodStart!),
    enabled: !!organizationId && !!userId && !!periodStart,
  })
}
