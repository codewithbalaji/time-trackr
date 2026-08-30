import { useQuery } from "@tanstack/react-query"

import { getRunningTimeEntry } from "@/features/time-tracking/services/time-entry.service"
import { timeEntryKeys } from "@/features/time-tracking/lib/query-keys"

export function useRunningTimeEntry(
  organizationId: string | undefined,
  userId: string | undefined
) {
  return useQuery({
    queryKey: timeEntryKeys.running(organizationId, userId),
    queryFn: () => getRunningTimeEntry(organizationId!, userId!),
    enabled: !!organizationId && !!userId,
  })
}
