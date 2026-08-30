import { useQuery } from "@tanstack/react-query"

import { listProjects } from "@/features/projects/services/project.service"
import { projectKeys } from "@/features/projects/lib/query-keys"

export function useProjects(organizationId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.list(organizationId),
    queryFn: () => listProjects(organizationId!),
    enabled: !!organizationId,
  })
}
