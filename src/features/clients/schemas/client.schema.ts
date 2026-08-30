import { z } from "zod"

export const clientSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),
})

export type ClientInput = z.infer<typeof clientSchema>
