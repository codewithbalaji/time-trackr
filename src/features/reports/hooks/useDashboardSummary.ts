import { useMemo } from "react"

import { topClient, topProject, totalDuration } from "@/features/reports/lib/aggregate"
import type { ReportEntry } from "@/features/reports/services/report.service"

// Derives the Dashboard's three stat-card values from already-fetched
// entries — no extra query, just a memoized reshape.
export function useDashboardSummary(entries: ReportEntry[] | undefined) {
  return useMemo(() => {
    const list = entries ?? []
    return {
      totalSeconds: totalDuration(list),
      topProject: topProject(list),
      topClient: topClient(list),
    }
  }, [entries])
}
