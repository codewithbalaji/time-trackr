import { z } from "zod"

// One definition for every email field in the app.
//
// React Hook Form hands over exactly what was typed, and neither the browser
// nor Supabase trims it — " User@x.com " was reaching GoTrue verbatim, where a
// stray space makes it a different address from the one the account was
// created under. Lowercasing matters for the same reason: invitations are
// matched case-insensitively in SQL, so the client shouldn't be the only place
// that treats "A@b.com" and "a@b.com" as different people.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Enter a valid email address")
