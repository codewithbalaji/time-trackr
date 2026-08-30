import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Project } from "@/features/projects/services/project.service"
import { useProjectMembers } from "@/features/projects/hooks/useProjectMembers"
import { useAddProjectMember } from "@/features/projects/hooks/useAddProjectMember"
import { useRemoveProjectMember } from "@/features/projects/hooks/useRemoveProjectMember"
import { useOrgMembers } from "@/features/users/hooks/useOrgMembers"

export function ProjectMembersDialog({
  project,
  organizationId,
  onOpenChange,
}: {
  project: Project | null
  organizationId: string
  onOpenChange: (open: boolean) => void
}) {
  const projectId = project?.id
  const { data: orgMembers, isLoading: orgMembersLoading } = useOrgMembers(organizationId)
  const { data: assignments, isLoading: assignmentsLoading } = useProjectMembers(projectId)
  const addMember = useAddProjectMember(projectId)
  const removeMember = useRemoveProjectMember(projectId)

  const isLoading = orgMembersLoading || assignmentsLoading

  return (
    <Dialog open={project !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage members</DialogTitle>
          <DialogDescription>
            Choose who's assigned to {project?.name ?? "this project"}.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading...
          </div>
        ) : (
          <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {(orgMembers ?? []).map((member) => {
              const assignment = assignments?.find((a) => a.profile.id === member.profile.id)
              const isAssigned = !!assignment

              return (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {member.profile.full_name ?? member.profile.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.profile.email}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={isAssigned ? "outline" : "secondary"}
                    size="sm"
                    disabled={addMember.isPending || removeMember.isPending}
                    onClick={() => {
                      if (isAssigned) {
                        removeMember.mutate(assignment.id)
                      } else {
                        addMember.mutate(member.profile.id)
                      }
                    }}
                  >
                    {isAssigned ? "Remove" : "Add"}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
