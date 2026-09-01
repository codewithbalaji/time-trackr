import { useQuery } from "@tanstack/react-query"

import { listOrgEntriesInRange } from "@/features/reports/services/report.service"
import { reportKeys } from "@/features/reports/lib/query-keys"
import type { DateRange } from "@/features/reports/lib/date-range-presets"
import { getRangeUtcBounds } from "@/features/timesheets/lib/week"

// Org-wide time entries within a report date range. `enabled` must be driven
// by useHasPermission(organizationId, "timesheets.approve") at the call
// site — this hook does not check the permission itself, since the real
// boundary is the Phase 8 RLS policy on time_entries (see report.service.ts);
// this is purely to avoid an unauthorized-looking network call from the UI.
export function useOrgReportEntries(
  organizationId: string | undefined,
  range: DateRange | undefined,
  timezone: string | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: reportKeys.orgEntries(organizationId, range?.start, range?.end),
    queryFn: () => {
      const { startIso, endIso } = getRangeUtcBounds(range!.start, range!.end, timezone!)
      return listOrgEntriesInRange(organizationId!, startIso, endIso)
    },
    enabled: enabled && !!organizationId && !!range && !!timezone,
  })
}
