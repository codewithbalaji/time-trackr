import { z } from "zod"

// Mirrors supabase/config.toml's [auth.email] minimum_password_length (8) and
// password_requirements ("lower_upper_letters_digits"). Supabase enforces this
// server-side; this schema exists so the UI can reject weak passwords before
// making a network call. Keep both in sync if the policy changes.
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a digit")
