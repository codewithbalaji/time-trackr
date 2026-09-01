import { useQuery } from "@tanstack/react-query"

import { listTimesheetHistory } from "@/features/approvals/services/approval.service"
import { approvalKeys } from "@/features/approvals/lib/query-keys"

export function useTimesheetHistory(timesheetId: string | undefined) {
  return useQuery({
    queryKey: approvalKeys.history(timesheetId),
    queryFn: () => listTimesheetHistory(timesheetId!),
    enabled: !!timesheetId,
  })
}
