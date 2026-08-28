import { z } from "zod"

export const inviteSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
})

export type InviteInput = z.infer<typeof inviteSchema>
