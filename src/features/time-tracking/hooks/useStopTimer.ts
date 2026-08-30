import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { stopTimer } from "@/features/time-tracking/services/time-entry.service"
import { mapTimeEntryError } from "@/features/time-tracking/services/time-entry-errors"
import { timeEntryKeys } from "@/features/time-tracking/lib/query-keys"

export function useStopTimer(organizationId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (entryId: string) => stopTimer(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.running(organizationId, userId) })
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.list(organizationId, userId) })
    },
    onError: (error: PostgrestError) => toast.error(mapTimeEntryError(error)),
  })
}
