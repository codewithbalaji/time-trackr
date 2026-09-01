import { z } from "zod"

export const rejectTimesheetSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Enter a reason.")
    .max(1000, "Reason must be 1000 characters or fewer"),
})

export type RejectTimesheetInput = z.infer<typeof rejectTimesheetSchema>
