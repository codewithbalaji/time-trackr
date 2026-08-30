import { z } from "zod"

// endTime/isRunning aren't both rendered by every form that uses this schema
// (ManualEntryForm always has isRunning=false; EditTimeEntryDialog sets it
// from the entry and hides the endTime field while running) — superRefine
// lets both share one schema instead of forking into near-duplicates.
export const timeEntrySchema = z
  .object({
    description: z
      .string()
      .min(1, "Description is required")
      .max(500, "Description must be 500 characters or fewer"),
    projectId: z.string().min(1, "Project is required"),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().optional(),
    isRunning: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.isRunning) return
    if (!data.endTime) {
      ctx.addIssue({ code: "custom", message: "End time is required", path: ["endTime"] })
      return
    }
    if (`${data.date}T${data.endTime}` <= `${data.date}T${data.startTime}`) {
      ctx.addIssue({
        code: "custom",
        message: "End time must be after start time",
        path: ["endTime"],
      })
    }
  })

export type TimeEntryInput = z.infer<typeof timeEntrySchema>
