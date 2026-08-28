import { z } from "zod"

import { passwordSchema } from "@/features/auth/schemas/password-policy"

export const inviteAcceptSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type InviteAcceptInput = z.infer<typeof inviteAcceptSchema>
