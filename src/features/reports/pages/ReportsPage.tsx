import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/features/auth/stores/authStore"
import { useClients } from "@/features/clients/hooks/useClients"
import { useCurrentOrganization } from "@/features/organizations/hooks/useCurrentOrganization"
import { useProjects } from "@/features/projects/hooks/useProjects"
import { useHasPermission } from "@/features/roles/hooks/useHasPermission"
import { formatDuration } from "@/features/time-tracking/lib/format-duration"
import { useOrgMembers } from "@/features/users/hooks/useOrgMembers"
import { DetailedEntriesTable } from "@/features/reports/components/DetailedEntriesTable"
import { ExportButton } from "@/features/reports/components/ExportButton"
import { HoursBarChart } from "@/features/reports/components/HoursBarChart"
import { ProjectDonutChart } from "@/features/reports/components/ProjectDonutChart"
import { ReportFilterBar } from "@/features/reports/components/ReportFilterBar"
import { SummaryTable } from "@/features/reports/components/SummaryTable"
import { useOrgReportEntries } from "@/features/reports/hooks/useOrgReportEntries"
import { useReportEntries } from "@/features/reports/hooks/useReportEntries"
import { useReportFilters } from "@/features/reports/hooks/useReportFilters"
import {
  groupByDescription,
  groupByProject,
  hoursPerDay,
  totalDuration,
} from "@/features/reports/lib/aggregate"
import type { ReportEntry } from "@/features/reports/services/report.service"

// Approvers (timesheets.approve) see the org-wide picture here, filterable
// down to one member via the Team Member select — everyone else only ever
// sees their own entries. No permission loader on the /reports route itself
// (see router.tsx); the page degrades to "only me" instead of blocking.
export function ReportsPage() {
  const userId = useAuthStore((state) => state.session?.user.id)
  const currentOrganization = useCurrentOrganization()
  const organizationId = currentOrganization?.organization.id
  const timezone = currentOrganization?.organization.timezone
  const canApprove = useHasPermission(organizationId, "timesheets.approve")

  const {
    range,
    preset,
    projectId,
    clientId,
    userId: filterUserId,
    selectPreset,
    selectCustomRange,
    setProjectId,
    setClientId,
    setUserId,
  } = useReportFilters(timezone)

  const { data: projects } = useProjects(organizationId)
  const { data: clients } = useClients(organizationId)
  const { data: members } = useOrgMembers(organizationId)

  const ownQuery = useReportEntries(organizationId, userId, range, timezone)
  const orgQuery = useOrgReportEntries(organizationId, range, timezone, canApprove)
  const activeQuery = canApprove ? orgQuery : ownQuery

  const filteredEntries = applyFilters(activeQuery.data ?? [], { projectId, clientId, filterUserId })
  const isLoading = activeQuery.isLoading

  const [groupBy, setGroupBy] = useState<"project" | "description">("project")
  const [activeTab, setActiveTab] = useState<"summary" | "detailed">("summary")

  const projectTotals = groupByProject(filteredEntries)
  const descriptionTotals = groupByDescription(filteredEntries)
  const barData = timezone ? hoursPerDay(filteredEntries, range.start, range.end, timezone) : []

  const exportSource =
    activeTab === "summary"
      ? {
          kind: "summary" as const,
          groupBy,
          rows: groupBy === "project" ? projectTotals : descriptionTotals,
        }
      : { kind: "detailed" as const, entries: filteredEntries, showMember: canApprove }

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Summaries and detailed entries for the selected range.
          </p>
        </div>
        <ExportButton source={exportSource} range={range} />
      </div>

      <div className="mt-6">
        <ReportFilterBar
          range={range}
          preset={preset}
          onPresetChange={selectPreset}
          onCustomRangeChange={selectCustomRange}
          projects={projects ?? []}
          clients={clients ?? []}
          members={members ?? []}
          projectId={projectId}
          clientId={clientId}
          userId={filterUserId}
          onProjectChange={setProjectId}
          onClientChange={setClientId}
          onUserChange={setUserId}
          showMemberFilter={canApprove}
        />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Total:{" "}
        <span className="font-medium text-foreground">
          {formatDuration(totalDuration(filteredEntries))}
        </span>
      </p>

      <Card className="mt-2">
        <CardContent>
          <HoursBarChart data={barData} isLoading={isLoading} />
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "summary" | "detailed")}
        className="mt-6"
      >
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Group by</span>
            <Select
              value={groupBy}
              onValueChange={(value) => setGroupBy(value as "project" | "description")}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="description">Description</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent>
              <SummaryTable
                rows={groupBy === "project" ? projectTotals : descriptionTotals}
                isLoading={isLoading}
                groupBy={groupBy}
              />
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
        </TabsContent>

        <TabsContent value="detailed">
          <Card>
            <CardContent>
              <DetailedEntriesTable
                entries={filteredEntries}
                isLoading={isLoading}
                showMember={canApprove}
                timezone={timezone ?? "UTC"}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function applyFilters(
  entries: ReportEntry[],
  filters: { projectId: string | null; clientId: string | null; filterUserId: string | null }
): ReportEntry[] {
  return entries.filter((entry) => {
    if (filters.projectId && entry.project.id !== filters.projectId) return false
    if (filters.clientId && entry.project.client?.id !== filters.clientId) return false
    if (filters.filterUserId && entry.user_id !== filters.filterUserId) return false
    return true
  })
}
