import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { resubmitTimesheet } from "@/features/timesheets/services/timesheet.service"
import { mapTimesheetError } from "@/features/timesheets/services/timesheet-errors"
import { timesheetKeys } from "@/features/timesheets/lib/query-keys"

export function useResubmitTimesheet(
  organizationId: string | undefined,
  userId: string | undefined,
  periodStart: string | undefined
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => resubmitTimesheet(organizationId!, periodStart!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: timesheetKeys.detail(organizationId, userId, periodStart),
      })
      toast.success("Timesheet resubmitted for review.")
    },
    onError: (error: PostgrestError) => toast.error(mapTimesheetError(error)),
  })
}
