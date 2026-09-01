import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import type { TimeEntry } from "@/features/time-tracking/services/time-entry.service"
import { useProjects } from "@/features/projects/hooks/useProjects"
import { useUpdateTimeEntry } from "@/features/time-tracking/hooks/useUpdateTimeEntry"

export function EditTimeEntryDialog({
  entry,
  organizationId,
  userId,
  onOpenChange,
}: {
  entry: TimeEntry | null
  organizationId: string
  userId: string
  onOpenChange: (open: boolean) => void
}) {
  const { data: projects } = useProjects(organizationId)
  const activeProjects = projects?.filter((project) => project.status === "active") ?? []
  const updateEntry = useUpdateTimeEntry(organizationId, userId)
  const isRunning = entry !== null && entry.end_time === null

  const form = useForm<TimeEntryInput>({
    resolver: zodResolver(timeEntrySchema),
    values: {
      description: entry?.description ?? "",
      projectId: entry?.project.id ?? "",
      date: entry ? format(new Date(entry.start_time), "yyyy-MM-dd") : "",
      startTime: entry ? format(new Date(entry.start_time), "HH:mm") : "",
      endTime: entry?.end_time ? format(new Date(entry.end_time), "HH:mm") : "",
      isRunning,
    },
  })

  function onSubmit(values: TimeEntryInput) {
    if (!entry) return
    updateEntry.mutate(
      {
        entryId: entry.id,
        projectId: values.projectId,
        description: values.description,
        startTime: new Date(`${values.date}T${values.startTime}`).toISOString(),
        endTime: isRunning
          ? undefined
          : new Date(`${values.date}T${values.endTime}`).toISOString(),
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={entry !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit time entry</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Project</FormLabel>
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
              {isRunning ? (
                <div className="flex flex-col justify-end pb-1.5">
                  <p className="text-xs text-muted-foreground">
                    Currently running — use Stop to end it.
                  </p>
                </div>
              ) : (
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
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateEntry.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
