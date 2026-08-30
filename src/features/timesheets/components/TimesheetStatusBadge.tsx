import { Badge } from "@/components/ui/badge"
import type { Timesheet } from "@/features/timesheets/services/timesheet.service"

// Draft/Submitted only — no new status hues, per DESIGN.md's explicit
// deferral of timesheet/approval status color scoping to Phase 7-8. Submitted
// reuses the one accent (default badge = bg-primary); draft is neutral.
export function TimesheetStatusBadge({ status }: { status: Timesheet["status"] }) {
  if (status === "submitted") {
    return <Badge>Submitted</Badge>
  }
  return <Badge variant="secondary">Draft</Badge>
}
