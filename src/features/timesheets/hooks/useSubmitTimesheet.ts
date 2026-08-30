import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { submitTimesheet } from "@/features/timesheets/services/timesheet.service"
import { mapTimesheetError } from "@/features/timesheets/services/timesheet-errors"
import { timesheetKeys } from "@/features/timesheets/lib/query-keys"

export function useSubmitTimesheet(
  organizationId: string | undefined,
  userId: string | undefined,
  periodStart: string | undefined
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => submitTimesheet(organizationId!, periodStart!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: timesheetKeys.detail(organizationId, userId, periodStart),
      })
      toast.success("Timesheet submitted.")
    },
    onError: (error: PostgrestError) => toast.error(mapTimesheetError(error)),
  })
}
