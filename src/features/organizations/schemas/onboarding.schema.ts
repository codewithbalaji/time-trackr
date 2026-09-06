import { z } from "zod"

// .trim() first: without it "   " passed the client and died on the database's
// `char_length(trim(name)) between 1 and 120` check, surfacing as a generic
// "That value isn't valid." toast rather than a message on the field. It also
// stops names being stored with the whitespace someone happened to paste.
export const organizationNameSchema = z
  .string()
  .trim()
  .min(1, "Organization name is required")
  .max(120, "Organization name must be 120 characters or fewer")

// No full-name field: signup already collects it, and that one reaches
// `profiles` via the handle_new_user trigger. Asking again here wrote to
// auth.users metadata, which nothing syncs after INSERT — so the name typed
// during onboarding was silently discarded. Profile settings is where a name
// gets changed.
export const onboardingSchema = z.object({
  organizationName: organizationNameSchema,
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
