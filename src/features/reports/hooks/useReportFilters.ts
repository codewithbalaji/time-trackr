import { useState } from "react"

import {
  resolveDateRangePreset,
  type DateRange,
  type DateRangePresetKey,
} from "@/features/reports/lib/date-range-presets"

const DEFAULT_PRESET: DateRangePresetKey = "this-week"

// Local UI-state hook shared by DashboardPage and ReportsPage: the active
// date range (plus which preset produced it, so DateRangePicker can
// highlight it) and the Reports filter-bar selects. Filters apply live —
// there's no separate pending/applied state, matching the plan's decision
// that there's no existing filter-bar precedent elsewhere in the app to
// match instead.
export function useReportFilters(timezone: string | undefined) {
  const [preset, setPreset] = useState<DateRangePresetKey | "custom">(DEFAULT_PRESET)
  const [range, setRange] = useState<DateRange>(() =>
    resolveDateRangePreset(DEFAULT_PRESET, timezone ?? "UTC")
  )
  const [projectId, setProjectId] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  function selectPreset(key: DateRangePresetKey) {
    setPreset(key)
    setRange(resolveDateRangePreset(key, timezone ?? "UTC"))
  }

  function selectCustomRange(nextRange: DateRange) {
    setPreset("custom")
    setRange(nextRange)
  }

  return {
    range,
    preset,
    projectId,
    clientId,
    userId,
    selectPreset,
    selectCustomRange,
    setProjectId,
    setClientId,
    setUserId,
  }
}
