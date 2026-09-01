import { Badge } from "@/components/ui/badge"
import type { Timesheet } from "@/features/timesheets/services/timesheet.service"

// Four statuses, no new hues added for approved/rejected — both reuse badge
// variants that already exist in the design system (outline, destructive),
// per DESIGN.md's explicit deferral of status color scoping to Phase 8 and
// its "One Accent Rule". Submitted keeps the one accent (default = bg-primary,
// an active/in-progress state); approved is a calm neutral outline (final,
// no accent needed); rejected reuses the existing muted destructive tint.
export function TimesheetStatusBadge({ status }: { status: Timesheet["status"] }) {
  if (status === "submitted") {
    return <Badge>Submitted</Badge>
  }
  if (status === "approved") {
    return <Badge variant="outline">Approved</Badge>
  }
  if (status === "rejected") {
    return <Badge variant="destructive">Rejected</Badge>
  }
  return <Badge variant="secondary">Draft</Badge>
}
