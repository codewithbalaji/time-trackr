import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { createProject } from "@/features/projects/services/project.service"
import { mapProjectError } from "@/features/projects/services/project-errors"
import { projectKeys } from "@/features/projects/lib/query-keys"

export function useCreateProject(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list(organizationId) })
    },
    onError: (error: PostgrestError) => toast.error(mapProjectError(error)),
  })
}
