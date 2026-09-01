import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { rejectTimesheet } from "@/features/approvals/services/approval.service"
import { mapApprovalError } from "@/features/approvals/services/approval-errors"
import { approvalKeys } from "@/features/approvals/lib/query-keys"
import { timesheetKeys } from "@/features/timesheets/lib/query-keys"

export function useRejectTimesheet(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      periodStart,
      reason,
    }: {
      userId: string
      periodStart: string
      reason: string
    }) => rejectTimesheet(organizationId!, userId, periodStart, reason),
    onSuccess: (_data, { userId, periodStart }) => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.pending(organizationId) })
      queryClient.invalidateQueries({
        queryKey: timesheetKeys.detail(organizationId, userId, periodStart),
      })
      toast.success("Timesheet rejected.")
    },
    onError: (error: PostgrestError) => toast.error(mapApprovalError(error)),
  })
}
