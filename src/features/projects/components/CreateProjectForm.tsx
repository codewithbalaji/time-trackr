import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { projectSchema, type ProjectInput } from "@/features/projects/schemas/project.schema"
import { useCreateProject } from "@/features/projects/hooks/useCreateProject"
import { useClients } from "@/features/clients/hooks/useClients"
import { useAuthStore } from "@/features/auth/stores/authStore"

const NO_CLIENT = "none"
const DEFAULT_COLOR = "#3B82F6"

export function CreateProjectForm({
  organizationId,
  onCreated,
}: {
  organizationId: string
  onCreated?: () => void
}) {
  const userId = useAuthStore((state) => state.session?.user.id)
  const createProject = useCreateProject(organizationId)
  const { data: clients } = useClients(organizationId)
  const activeClients = clients?.filter((client) => client.status === "active") ?? []

  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", clientId: null, color: DEFAULT_COLOR, description: "" },
  })

  function onSubmit(values: ProjectInput) {
    createProject.mutate(
      {
        organizationId,
        name: values.name,
        clientId: values.clientId,
        color: values.color,
        description: values.description,
        createdBy: userId!,
      },
      {
        onSuccess: () => {
          toast.success(`${values.name} created.`)
          form.reset({ name: "", clientId: null, color: DEFAULT_COLOR, description: "" })
          onCreated?.()
        },
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
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
                <FormLabel className="sr-only">Project name</FormLabel>
                <FormControl>
                  <Input placeholder="Project name" {...field} />
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
              <FormLabel className="sr-only">Client</FormLabel>
              <Select
                value={field.value ?? NO_CLIENT}
                onValueChange={(value) => field.onChange(value === NO_CLIENT ? null : value)}
              >
                <FormControl>
                  <SelectTrigger aria-label="Client" className="w-full">
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
              <FormLabel className="sr-only">Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Description (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createProject.isPending} className="self-end">
          {createProject.isPending ? "Creating..." : "Create project"}
        </Button>
      </form>
    </Form>
  )
}
