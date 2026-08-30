import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { setProjectStatus } from "@/features/projects/services/project.service"
import { mapProjectError } from "@/features/projects/services/project-errors"
import { projectKeys } from "@/features/projects/lib/query-keys"

export function useSetProjectStatus(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      status,
    }: {
      projectId: string
      status: "active" | "archived"
    }) => setProjectStatus(projectId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list(organizationId) })
    },
    onError: (error: PostgrestError) => toast.error(mapProjectError(error)),
  })
}
