import { TriangleAlert } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentOrganization } from "@/features/organizations/hooks/useCurrentOrganization"
import { useAuthStore } from "@/features/auth/stores/authStore"
import { useTimeEntries } from "@/features/time-tracking/hooks/useTimeEntries"
import { useStartTimer } from "@/features/time-tracking/hooks/useStartTimer"
import { TimerBar } from "@/features/time-tracking/components/TimerBar"
import { ManualEntryDialog } from "@/features/time-tracking/components/ManualEntryDialog"
import { TimeEntriesList } from "@/features/time-tracking/components/TimeEntriesList"
import type { TimeEntry } from "@/features/time-tracking/services/time-entry.service"

export function TimeTrackerPage() {
  const membership = useCurrentOrganization()
  const organizationId = membership?.organization.id
  const dateFormat = membership?.organization.date_format
  const timeFormat = membership?.organization.time_format
  const userId = useAuthStore((state) => state.session?.user.id)
  const { data: entries, isLoading, isError } = useTimeEntries(organizationId, userId)
  const startTimer = useStartTimer(organizationId, userId)

  function handleRestart(entry: TimeEntry) {
    if (!organizationId) return
    startTimer.mutate({
      organizationId,
      projectId: entry.project.id,
      description: entry.description,
    })
  }

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">Time Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track the time you spend on your organization's projects.
          </p>
        </div>
        {organizationId && userId && (
          <ManualEntryDialog organizationId={organizationId} userId={userId} />
        )}
      </div>

      {organizationId && userId && (
        <div className="mt-8">
          <TimerBar organizationId={organizationId} userId={userId} />
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-destructive/40 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
                <TriangleAlert className="size-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium">Couldn't load time entries</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Something went wrong loading your entries. Try refreshing the page.
                </p>
              </div>
            </div>
          ) : (
            <TimeEntriesList
              entries={entries ?? []}
              isLoading={isLoading}
              organizationId={organizationId!}
              userId={userId!}
              dateFormat={dateFormat!}
              timeFormat={timeFormat!}
              onRestart={handleRestart}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
