import { formatDistanceToNowStrict } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import type { AuditLogEntry } from "@/features/audit/services/audit.service"

const TARGET_LABEL: Record<string, string> = {
  organizations: "organization",
  memberships: "member",
  invitations: "invitation",
  clients: "client",
  projects: "project",
  project_members: "project member",
  time_entries: "time entry",
  timesheets: "timesheet",
}

const VERB_LABEL: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
}

function describeAction(action: string): string {
  if (action === "role_assigned") return "Role assigned"
  const verb = action.split("_").pop()
  return (verb && VERB_LABEL[verb]) ?? action
}

export function AuditLogRow({ entry }: { entry: AuditLogEntry }) {
  const actorLabel = entry.actor ? (entry.actor.full_name ?? entry.actor.email) : "System"
  const targetLabel = TARGET_LABEL[entry.target_type] ?? entry.target_type

  return (
    <TableRow>
      <TableCell className="font-medium">{actorLabel}</TableCell>
      <TableCell>
        <Badge variant="outline">{describeAction(entry.action)}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{targetLabel}</TableCell>
      <TableCell className="text-right text-muted-foreground">
        {formatDistanceToNowStrict(new Date(entry.created_at), { addSuffix: true })}
      </TableCell>
    </TableRow>
  )
}
