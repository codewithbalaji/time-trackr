import { TriangleAlert } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentOrganization } from "@/features/organizations/hooks/useCurrentOrganization"
import { useProjects } from "@/features/projects/hooks/useProjects"
import { CreateProjectDialog } from "@/features/projects/components/CreateProjectDialog"
import { ProjectsTable } from "@/features/projects/components/ProjectsTable"
import { useHasPermission } from "@/features/roles/hooks/useHasPermission"

export function ProjectsPage() {
  const membership = useCurrentOrganization()
  const organizationId = membership?.organization.id
  const canManageProjects = useHasPermission(organizationId, "projects.manage")
  const { data: projects, isLoading, isError } = useProjects(organizationId)

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The projects your organization is tracking time against.
          </p>
        </div>
        {canManageProjects && organizationId && (
          <CreateProjectDialog organizationId={organizationId} />
        )}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>All projects</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-destructive/40 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
                <TriangleAlert className="size-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium">Couldn't load projects</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Something went wrong loading the list. Try refreshing the page.
                </p>
              </div>
            </div>
          ) : (
            <ProjectsTable
              projects={projects ?? []}
              isLoading={isLoading}
              organizationId={organizationId!}
              canManageProjects={canManageProjects}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
