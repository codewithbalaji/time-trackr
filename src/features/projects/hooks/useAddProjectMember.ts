import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { addProjectMember } from "@/features/projects/services/project-members.service"
import { mapProjectError } from "@/features/projects/services/project-errors"
import { projectKeys } from "@/features/projects/lib/query-keys"

export function useAddProjectMember(projectId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => addProjectMember(projectId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) })
    },
    onError: (error: PostgrestError) => toast.error(mapProjectError(error)),
  })
}
