import { z } from "zod"

import { emailSchema } from "@/features/auth/schemas/email"
import { passwordSchema } from "@/features/auth/schemas/password-policy"

export const changePasswordSchema = z
  .object({
    // Not passwordSchema: this is whatever they already have, which may predate
    // the current policy. Validating it here would reject a correct password.
    currentPassword: z.string().min(1, "Enter your current password"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.password !== data.currentPassword, {
    message: "Your new password must be different from your current one",
    path: ["password"],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

export const changeEmailSchema = z.object({
  email: emailSchema,
})

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>
