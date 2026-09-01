import { useState } from "react"
import { format } from "date-fns"
import { TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentOrganization } from "@/features/organizations/hooks/useCurrentOrganization"
import { useAuthStore } from "@/features/auth/stores/authStore"
import { useTimesheet } from "@/features/timesheets/hooks/useTimesheet"
import { useTimeEntriesForPeriod } from "@/features/timesheets/hooks/useTimeEntriesForPeriod"
import { WeekNavigator } from "@/features/timesheets/components/WeekNavigator"
import { TimesheetStatusBadge } from "@/features/timesheets/components/TimesheetStatusBadge"
import { SubmitTimesheetButton } from "@/features/timesheets/components/SubmitTimesheetButton"
import { WeeklyTimesheetGrid } from "@/features/timesheets/components/WeeklyTimesheetGrid"
import { DailyTimesheetView } from "@/features/timesheets/components/DailyTimesheetView"
import { DayEntriesDialog } from "@/features/timesheets/components/DayEntriesDialog"
import { getEntryDateKey, getWeekDays, getWeekStart } from "@/features/timesheets/lib/week"
import { ApprovalHistoryList } from "@/features/approvals/components/ApprovalHistoryList"

type ViewMode = "weekly" | "daily"

type SelectedCell = {
  project: { id: string; name: string }
  date: Date
}

export function TimesheetsPage() {
  const membership = useCurrentOrganization()
  const organizationId = membership?.organization.id
  const timezone = membership?.organization.timezone
  const dateFormat = membership?.organization.date_format
  const timeFormat = membership?.organization.time_format
  const userId = useAuthStore((state) => state.session?.user.id)

  const [periodStart, setPeriodStart] = useState<string | undefined>(undefined)
  const [view, setView] = useState<ViewMode>("weekly")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)

  // Defaults to the current week once the org's timezone is known — can't be
  // computed up front since it depends on that async membership data. Setting
  // state during render here is the documented React pattern for adjusting
  // state from a prop that just became available (see useElapsedSeconds.ts
  // for the same idiom): it converges after one extra render, since the
  // condition stops holding once periodStart is set.
  if (periodStart === undefined && timezone) {
    setPeriodStart(getWeekStart(new Date(), timezone))
  }

  const { data: timesheet } = useTimesheet(organizationId, userId, periodStart)
  const {
    data: entries,
    isLoading,
    isError,
  } = useTimeEntriesForPeriod(organizationId, userId, periodStart, timezone)

  const status = timesheet?.status ?? "draft"
  const locked = status === "submitted" || status === "approved"
  const days = periodStart ? getWeekDays(periodStart) : []
  const activeDate = selectedDate ?? days[0]

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">Timesheets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and submit the time you've tracked each week.
          </p>
        </div>
        {organizationId && userId && periodStart && (
          <SubmitTimesheetButton
            organizationId={organizationId}
            userId={userId}
            periodStart={periodStart}
            status={status}
            rejectionReason={timesheet?.rejection_reason}
          />
        )}
      </div>

      {timezone && periodStart && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <WeekNavigator periodStart={periodStart} timezone={timezone} onChange={setPeriodStart} />
          <div className="flex items-center gap-2">
            <TimesheetStatusBadge status={status} />
            <div className="flex gap-1 rounded-lg border border-border p-0.5">
              <Button
                type="button"
                size="sm"
                variant={view === "weekly" ? "secondary" : "ghost"}
                onClick={() => setView("weekly")}
              >
                Weekly
              </Button>
              <Button
                type="button"
                size="sm"
                variant={view === "daily" ? "secondary" : "ghost"}
                onClick={() => setView("daily")}
              >
                Daily
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{view === "weekly" ? "This week" : "This day"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-destructive/40 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
                <TriangleAlert className="size-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium">Couldn't load this timesheet</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Something went wrong loading time entries. Try refreshing the page.
                </p>
              </div>
            </div>
          ) : view === "weekly" ? (
            periodStart &&
            timezone && (
              <WeeklyTimesheetGrid
                entries={entries ?? []}
                isLoading={isLoading}
                periodStart={periodStart}
                timezone={timezone}
                onSelectCell={(project, date) => setSelectedCell({ project, date })}
              />
            )
          ) : (
            timezone &&
            dateFormat &&
            timeFormat &&
            activeDate &&
            organizationId &&
            userId && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-1.5">
                  {days.map((day) => (
                    <Button
                      key={day.toISOString()}
                      type="button"
                      size="sm"
                      variant={
                        format(day, "yyyy-MM-dd") === format(activeDate, "yyyy-MM-dd")
                          ? "secondary"
                          : "outline"
                      }
                      className="min-w-16"
                      onClick={() => setSelectedDate(day)}
                    >
                      {format(day, "EEE d")}
                    </Button>
                  ))}
                </div>
                <DailyTimesheetView
                  entries={entries ?? []}
                  date={activeDate}
                  timezone={timezone}
                  organizationId={organizationId}
                  userId={userId}
                  locked={locked}
                  dateFormat={dateFormat}
                  timeFormat={timeFormat}
                />
              </div>
            )
          )}
        </CardContent>
      </Card>

      {status === "rejected" && timesheet && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalHistoryList timesheetId={timesheet.id} />
          </CardContent>
        </Card>
      )}

      {selectedCell && organizationId && userId && timezone && dateFormat && timeFormat && (
        <DayEntriesDialog
          open
          onOpenChange={(open) => {
            if (!open) setSelectedCell(null)
          }}
          date={selectedCell.date}
          projectId={selectedCell.project.id}
          projectName={selectedCell.project.name}
          entries={(entries ?? []).filter(
            (entry) =>
              entry.project.id === selectedCell.project.id &&
              getEntryDateKey(entry.start_time, timezone) === format(selectedCell.date, "yyyy-MM-dd")
          )}
          organizationId={organizationId}
          userId={userId}
          locked={locked}
          dateFormat={dateFormat}
          timeFormat={timeFormat}
        />
      )}
    </div>
  )
}
