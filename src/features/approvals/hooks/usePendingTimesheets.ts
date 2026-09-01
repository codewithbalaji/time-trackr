import { useQuery } from "@tanstack/react-query"

import { listPendingTimesheets } from "@/features/approvals/services/approval.service"
import { approvalKeys } from "@/features/approvals/lib/query-keys"

export function usePendingTimesheets(organizationId: string | undefined) {
  return useQuery({
    queryKey: approvalKeys.pending(organizationId),
    queryFn: () => listPendingTimesheets(organizationId!),
    enabled: !!organizationId,
  })
}
