import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PostgrestError } from "@supabase/supabase-js"

import { createInvitation } from "@/features/users/services/invitation.service"
import { mapOrganizationError } from "@/features/organizations/services/organization-errors"

export function useCreateInvitation() {
  return useMutation({
    mutationFn: createInvitation,
    onError: (error: PostgrestError) => toast.error(mapOrganizationError(error)),
  })
}
