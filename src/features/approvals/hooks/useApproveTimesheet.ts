import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { approveTimesheet } from "@/features/approvals/services/approval.service"
import { mapApprovalError } from "@/features/approvals/services/approval-errors"
import { approvalKeys } from "@/features/approvals/lib/query-keys"
import { timesheetKeys } from "@/features/timesheets/lib/query-keys"

export function useApproveTimesheet(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, periodStart }: { userId: string; periodStart: string }) =>
      approveTimesheet(organizationId!, userId, periodStart),
    onSuccess: (_data, { userId, periodStart }) => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.pending(organizationId) })
      queryClient.invalidateQueries({
        queryKey: timesheetKeys.detail(organizationId, userId, periodStart),
      })
      toast.success("Timesheet approved.")
    },
    onError: (error: PostgrestError) => toast.error(mapApprovalError(error)),
  })
}
