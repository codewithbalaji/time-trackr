import { useQuery } from "@tanstack/react-query"

import { listClients } from "@/features/clients/services/client.service"
import { clientKeys } from "@/features/clients/lib/query-keys"

export function useClients(organizationId: string | undefined) {
  return useQuery({
    queryKey: clientKeys.list(organizationId),
    queryFn: () => listClients(organizationId!),
    enabled: !!organizationId,
  })
}
