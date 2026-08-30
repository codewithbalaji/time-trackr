import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { setClientStatus } from "@/features/clients/services/client.service"
import { mapClientError } from "@/features/clients/services/client-errors"
import { clientKeys } from "@/features/clients/lib/query-keys"

export function useSetClientStatus(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      clientId,
      status,
    }: {
      clientId: string
      status: "active" | "archived"
    }) => setClientStatus(clientId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.list(organizationId) })
    },
    onError: (error: PostgrestError) => toast.error(mapClientError(error)),
  })
}
