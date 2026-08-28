import { z } from "zod"

import { organizationNameSchema } from "@/features/organizations/schemas/onboarding.schema"

export const createOrganizationSchema = z.object({
  organizationName: organizationNameSchema,
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
