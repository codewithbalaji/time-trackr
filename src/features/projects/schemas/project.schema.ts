import { z } from "zod"

export const projectSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),
  clientId: z.string().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid hex color"),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or fewer")
    .optional(),
})

export type ProjectInput = z.infer<typeof projectSchema>
