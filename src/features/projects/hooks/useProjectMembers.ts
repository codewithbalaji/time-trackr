import { useQuery } from "@tanstack/react-query"

import { listProjectMembers } from "@/features/projects/services/project-members.service"
import { projectKeys } from "@/features/projects/lib/query-keys"

export function useProjectMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.members(projectId),
    queryFn: () => listProjectMembers(projectId!),
    enabled: !!projectId,
  })
}
