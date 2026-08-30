import { z } from "zod"

import { DATE_FORMAT_VALUES, TIME_FORMAT_VALUES } from "@/features/organizations/lib/date-time-format"

export const updateTimeSettingsSchema = z.object({
  timezone: z.string().min(1, "Timezone is required"),
  dateFormat: z.enum(DATE_FORMAT_VALUES),
  timeFormat: z.enum(TIME_FORMAT_VALUES),
  dayStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a time as HH:mm"),
})

export type UpdateTimeSettingsInput = z.infer<typeof updateTimeSettingsSchema>
