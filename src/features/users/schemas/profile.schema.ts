import { z } from "zod"

export const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(120, "Full name is too long"),
})

export type ProfileInput = z.infer<typeof profileSchema>
