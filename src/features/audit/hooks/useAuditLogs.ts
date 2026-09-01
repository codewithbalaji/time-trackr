import { useQuery } from "@tanstack/react-query"

import { listAuditLogs } from "@/features/audit/services/audit.service"
import { auditKeys } from "@/features/audit/lib/query-keys"

export function useAuditLogs(organizationId: string | undefined, opts: { limit?: number } = {}) {
  return useQuery({
    // auditKeys.list(organizationId) stays a valid prefix for invalidation
    // regardless of limit, since limit is appended after it.
    queryKey: [...auditKeys.list(organizationId), opts.limit ?? null],
    queryFn: () => listAuditLogs(organizationId!, opts),
    enabled: !!organizationId,
  })
}
