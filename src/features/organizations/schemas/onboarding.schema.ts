import { z } from "zod"

export const organizationNameSchema = z
  .string()
  .min(1, "Organization name is required")
  .max(120, "Organization name must be 120 characters or fewer")

export const onboardingSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  organizationName: organizationNameSchema,
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
