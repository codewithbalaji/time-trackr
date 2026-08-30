import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { FolderKanban, Loader2, MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { projectSchema, type ProjectInput } from "@/features/projects/schemas/project.schema"
import type { Project } from "@/features/projects/services/project.service"
import { useUpdateProject } from "@/features/projects/hooks/useUpdateProject"
import { useSetProjectStatus } from "@/features/projects/hooks/useSetProjectStatus"
import { useClients } from "@/features/clients/hooks/useClients"
import { ProjectMembersDialog } from "@/features/projects/components/ProjectMembersDialog"

const NO_CLIENT = "none"

export function ProjectsTable({
  projects,
  isLoading,
  organizationId,
  canManageProjects,
}: {
  projects: Project[]
  isLoading: boolean
  organizationId: string
  canManageProjects: boolean
}) {
  const updateProject = useUpdateProject(organizationId)
  const setStatus = useSetProjectStatus(organizationId)
  const [editing, setEditing] = useState<Project | null>(null)
  const [managingMembers, setManagingMembers] = useState<Project | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading projects...
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
          <FolderKanban className="size-5 text-accent-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">No projects yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Create a project above to start organizing work.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            {canManageProjects && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: project.color }}
                    aria-hidden="true"
                  />
                  {project.name}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {project.client?.name ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant={project.status === "active" ? "outline" : "secondary"}>
                  {project.status === "active" ? "Active" : "Archived"}
                </Badge>
              </TableCell>
              {canManageProjects && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Project actions">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(project)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setManagingMembers(project)}>
                        Manage members
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          setStatus.mutate({
                            projectId: project.id,
                            status: project.status === "active" ? "archived" : "active",
                          })
                        }
                      >
                        {project.status === "active" ? "Archive" : "Restore"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditProjectDialog
        project={editing}
        organizationId={organizationId}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={(values) => {
          if (editing) updateProject.mutate({ projectId: editing.id, ...values })
          setEditing(null)
        }}
      />

      <ProjectMembersDialog
        project={managingMembers}
        organizationId={organizationId}
        onOpenChange={(open) => !open && setManagingMembers(null)}
      />
    </>
  )
}

function EditProjectDialog({
  project,
  organizationId,
  onOpenChange,
  onSubmit,
}: {
  project: Project | null
  organizationId: string
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ProjectInput) => void
}) {
  const { data: clients } = useClients(organizationId)
  const activeClients = clients?.filter((client) => client.status === "active") ?? []

  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    values: {
      name: project?.name ?? "",
      clientId: project?.client?.id ?? null,
      color: project?.color ?? "#3B82F6",
      description: project?.description ?? "",
    },
  })

  return (
    <Dialog open={project !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Color</FormLabel>
                    <FormControl>
                      <input
                        type="color"
                        className="size-8 cursor-pointer rounded-lg border border-input bg-transparent p-0.5"
                        value={field.value}
                        onChange={field.onChange}
                        aria-label="Project color"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="sr-only">Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select
                    value={field.value ?? NO_CLIENT}
                    onValueChange={(value) => field.onChange(value === NO_CLIENT ? null : value)}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Client">
                        <SelectValue placeholder="No client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_CLIENT}>No client</SelectItem>
                      {activeClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
