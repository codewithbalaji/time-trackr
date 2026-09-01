import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { formatDuration } from "@/features/time-tracking/lib/format-duration"
import type { ProjectTotal } from "@/features/reports/lib/aggregate"

// Blue-only palette at varying opacity steps against the one accent color —
// see DESIGN.md's Charts section (an extension of The One Accent Rule: never
// a rainbow of series colors). color-mix() against var(--color-primary)
// tracks the current light/dark theme automatically instead of hard-coding
// oklch values per slice.
const SLICE_OPACITIES = [1, 0.75, 0.55, 0.4, 0.28, 0.2]

export function ProjectDonutChart({
  data,
  isLoading,
}: {
  data: ProjectTotal[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Loading chart...
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-center">
        <p className="text-sm font-medium">No project breakdown yet</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Track time against a project to see it here.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="totalSeconds"
              nameKey="projectName"
              innerRadius="55%"
              outerRadius="90%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={entry.projectId} fill={sliceColor(index)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "none",
                color: "var(--popover-foreground)",
                fontSize: "0.8125rem",
              }}
              formatter={(value, _name, item) => [
                formatDuration(Number(value)),
                (item?.payload as ProjectTotal | undefined)?.projectName ?? "",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {data.map((entry, index) => (
          <li key={entry.projectId} className="flex items-center gap-1.5 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: sliceColor(index) }}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{entry.projectName}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function sliceColor(index: number): string {
  const opacity = SLICE_OPACITIES[index] ?? SLICE_OPACITIES[SLICE_OPACITIES.length - 1]
  return `color-mix(in oklab, var(--color-primary) ${opacity * 100}%, transparent)`
}
