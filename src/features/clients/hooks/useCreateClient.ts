import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { createClient } from "@/features/clients/services/client.service"
import { mapClientError } from "@/features/clients/services/client-errors"
import { clientKeys } from "@/features/clients/lib/query-keys"

export function useCreateClient(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.list(organizationId) })
    },
    onError: (error: PostgrestError) => toast.error(mapClientError(error)),
  })
}
