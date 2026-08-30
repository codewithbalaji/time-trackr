import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { format } from "date-fns"

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
import { timeEntrySchema, type TimeEntryInput } from "@/features/time-tracking/schemas/time-entry.schema"
import { useProjects } from "@/features/projects/hooks/useProjects"
import { useCreateManualEntry } from "@/features/time-tracking/hooks/useCreateManualEntry"

function defaultValues(): TimeEntryInput {
  return {
    description: "",
    projectId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "",
    endTime: "",
    isRunning: false,
  }
}

export function ManualEntryForm({
  organizationId,
  userId,
  onCreated,
}: {
  organizationId: string
  userId: string
  onCreated?: () => void
}) {
  const { data: projects } = useProjects(organizationId)
  const activeProjects = projects?.filter((project) => project.status === "active") ?? []
  const createEntry = useCreateManualEntry(organizationId, userId)

  const form = useForm<TimeEntryInput>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: defaultValues(),
  })

  function onSubmit(values: TimeEntryInput) {
    createEntry.mutate(
      {
        organizationId,
        userId,
        projectId: values.projectId,
        description: values.description,
        startTime: new Date(`${values.date}T${values.startTime}`).toISOString(),
        endTime: new Date(`${values.date}T${values.endTime}`).toISOString(),
      },
      {
        onSuccess: () => {
          toast.success("Time entry added.")
          form.reset(defaultValues())
          onCreated?.()
        },
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Description</FormLabel>
              <FormControl>
                <Input placeholder="What did you work on?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Project</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger aria-label="Project" className="w-full">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {activeProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={createEntry.isPending} className="self-end">
          {createEntry.isPending ? "Adding..." : "Add entry"}
        </Button>
      </form>
    </Form>
  )
}
