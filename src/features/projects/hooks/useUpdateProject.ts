import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { updateProject } from "@/features/projects/services/project.service"
import { mapProjectError } from "@/features/projects/services/project-errors"
import { projectKeys } from "@/features/projects/lib/query-keys"

export function useUpdateProject(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      ...input
    }: {
      projectId: string
      name: string
      clientId: string | null
      color: string
      description?: string
    }) => updateProject(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list(organizationId) })
    },
    onError: (error: PostgrestError) => toast.error(mapProjectError(error)),
  })
}
