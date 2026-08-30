import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { updateTimeEntry } from "@/features/time-tracking/services/time-entry.service"
import { mapTimeEntryError } from "@/features/time-tracking/services/time-entry-errors"
import { timeEntryKeys } from "@/features/time-tracking/lib/query-keys"

export function useUpdateTimeEntry(
  organizationId: string | undefined,
  userId: string | undefined
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      entryId,
      ...input
    }: {
      entryId: string
      projectId: string
      description: string
      startTime: string
      endTime?: string
    }) => updateTimeEntry(entryId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.list(organizationId, userId) })
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.running(organizationId, userId) })
    },
    onError: (error: PostgrestError) => toast.error(mapTimeEntryError(error)),
  })
}
