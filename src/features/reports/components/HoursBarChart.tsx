import { format } from "date-fns"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { formatDuration } from "@/features/time-tracking/lib/format-duration"
import type { DayHours } from "@/features/reports/lib/aggregate"

export function HoursBarChart({ data, isLoading }: { data: DayHours[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Loading chart...
      </div>
    )
  }

  const hasData = data.some((day) => day.hours > 0)
  if (!hasData) {
    return (
      <div className="flex h-56 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-center">
        <p className="text-sm font-medium">No time tracked in this range</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Bars will appear here once entries are tracked.
        </p>
      </div>
    )
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="dateKey"
            tickFormatter={(value: string) => format(parseDateKey(value), "EEE d")}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={32}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "none",
              color: "var(--popover-foreground)",
              fontSize: "0.8125rem",
            }}
            formatter={(value) => [formatDuration(Math.round(Number(value) * 3600)), "Tracked"]}
            labelFormatter={(value) => format(parseDateKey(String(value)), "EEE, MMM d")}
          />
          <Bar dataKey="hours" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`)
}
