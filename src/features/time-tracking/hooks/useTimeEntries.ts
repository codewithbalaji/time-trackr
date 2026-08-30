import { useQuery } from "@tanstack/react-query"
import { subDays } from "date-fns"

import { listTimeEntries } from "@/features/time-tracking/services/time-entry.service"
import { timeEntryKeys } from "@/features/time-tracking/lib/query-keys"

// A rolling window, not the full history — the day-grouped list on the Time
// Tracker page is for recent context, not a report. Full history browsing
// belongs to Phase 7 (Timesheets)/Phase 9 (Reports).
const HISTORY_DAYS = 14

export function useTimeEntries(organizationId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: timeEntryKeys.list(organizationId, userId),
    queryFn: () =>
      listTimeEntries(organizationId!, userId!, subDays(new Date(), HISTORY_DAYS).toISOString()),
    enabled: !!organizationId && !!userId,
  })
}
