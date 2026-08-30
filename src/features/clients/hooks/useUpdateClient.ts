import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { updateClientName } from "@/features/clients/services/client.service"
import { mapClientError } from "@/features/clients/services/client-errors"
import { clientKeys } from "@/features/clients/lib/query-keys"

export function useUpdateClient(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, name }: { clientId: string; name: string }) =>
      updateClientName(clientId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.list(organizationId) })
    },
    onError: (error: PostgrestError) => toast.error(mapClientError(error)),
  })
}
