import { z } from "zod"

import { emailSchema } from "@/features/auth/schemas/email"

import { passwordSchema } from "@/features/auth/schemas/password-policy"

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required").max(120, "Full name is too long"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type SignupInput = z.infer<typeof signupSchema>
