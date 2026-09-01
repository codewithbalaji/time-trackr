import { useState } from "react"
import { Clock, FolderKanban, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProfile } from "@/features/auth/hooks/useProfile"
import { useAuthStore } from "@/features/auth/stores/authStore"
import { useCurrentOrganization } from "@/features/organizations/hooks/useCurrentOrganization"
import { useHasPermission } from "@/features/roles/hooks/useHasPermission"
import { formatDuration } from "@/features/time-tracking/lib/format-duration"
import { DateRangePicker } from "@/features/reports/components/DateRangePicker"
import { HoursBarChart } from "@/features/reports/components/HoursBarChart"
import { ProjectDonutChart } from "@/features/reports/components/ProjectDonutChart"
import { StatCard } from "@/features/reports/components/StatCard"
import { TeamActivityTable } from "@/features/reports/components/TeamActivityTable"
import { useDashboardSummary } from "@/features/reports/hooks/useDashboardSummary"
import { useOrgReportEntries } from "@/features/reports/hooks/useOrgReportEntries"
import { useReportEntries } from "@/features/reports/hooks/useReportEntries"
import { useReportFilters } from "@/features/reports/hooks/useReportFilters"
import { groupByProject, hoursPerDay } from "@/features/reports/lib/aggregate"

// Moved from src/pages/DashboardPage.tsx (Phase 9) — now the Dashboard's real
// implementation instead of the Phase 1 "coming soon" placeholder. Reuses
// useReportFilters/useReportEntries/useOrgReportEntries and the shared
// DateRangePicker with ReportsPage; the "showTeam" toggle is local state
// here rather than part of the shared filters hook, since it's a
// Dashboard-only concept (see the Phase 9 plan).
export function DashboardPage() {
  const { data: profile } = useProfile()
  const firstName = profile?.full_name?.split(" ")[0]
  const userId = useAuthStore((state) => state.session?.user.id)
  const currentOrganization = useCurrentOrganization()
  const organizationId = currentOrganization?.organization.id
  const timezone = currentOrganization?.organization.timezone
  const canApprove = useHasPermission(organizationId, "timesheets.approve")
  const [showTeam, setShowTeam] = useState(false)

  const { range, preset, selectPreset, selectCustomRange } = useReportFilters(timezone)

  const isTeamView = canApprove && showTeam
  const ownQuery = useReportEntries(organizationId, userId, range, timezone)
  const orgQuery = useOrgReportEntries(organizationId, range, timezone, isTeamView)
  const activeQuery = isTeamView ? orgQuery : ownQuery

  const entries = activeQuery.data
  const isLoading = activeQuery.isLoading
  const hasEntries = (entries?.length ?? 0) > 0

  const summary = useDashboardSummary(entries)
  const barData = timezone ? hoursPerDay(entries ?? [], range.start, range.end, timezone) : []
  const projectTotals = entries ? groupByProject(entries) : []

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">Welcome{firstName ? `, ${firstName}` : ""}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your time tracking overview for the selected range.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canApprove && (
            <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
              <Button
                type="button"
                variant={!showTeam ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowTeam(false)}
              >
                Only me
              </Button>
              <Button
                type="button"
                variant={showTeam ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowTeam(true)}
              >
                Team
              </Button>
            </div>
          )}
          <DateRangePicker
            value={range}
            preset={preset}
            onPresetChange={selectPreset}
            onCustomChange={selectCustomRange}
          />
        </div>
      </div>

      {!isLoading && !hasEntries ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
            <Clock className="size-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No time tracked yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Time tracked in this range will show up here — try Time Tracking to log some.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total time" value={formatDuration(summary.totalSeconds)} icon={Clock} />
            <StatCard
              label="Top project"
              value={summary.topProject?.projectName ?? "—"}
              description={
                summary.topProject ? formatDuration(summary.topProject.totalSeconds) : undefined
              }
              icon={FolderKanban}
            />
            <StatCard
              label="Top client"
              value={summary.topClient?.clientName ?? "—"}
              description={
                summary.topClient ? formatDuration(summary.topClient.totalSeconds) : undefined
              }
              icon={Users}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Hours per day</CardTitle>
            </CardHeader>
            <CardContent>
              <HoursBarChart data={barData} isLoading={isLoading} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By project</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectDonutChart data={projectTotals} isLoading={isLoading} />
            </CardContent>
          </Card>

          {isTeamView && (
            <Card>
              <CardHeader>
                <CardTitle>Team activity</CardTitle>
              </CardHeader>
              <CardContent>
                <TeamActivityTable entries={entries ?? []} isLoading={isLoading} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
