import { supabase } from "@/lib/supabase"

export type SignUpInput = {
  email: string
  password: string
  fullName: string
  // Where the confirmation email should land. Defaults to /auth/callback; the
  // invite flow passes its own /invite/accept?token=... so a new invitee comes
  // straight back to the invitation after confirming.
  redirectPath?: string
}

export type LoginInput = {
  email: string
  password: string
}

export async function signUp({ email, password, fullName, redirectPath }: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${window.location.origin}${redirectPath ?? "/auth/callback"}`,
    },
  })
  if (error) throw error
  return data
}

export async function signInWithPassword({ email, password }: LoginInput) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPasswordForEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
  })
  if (error) throw error
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

// Changing a password from account settings, where the person is already
// signed in and so must prove they are the account holder rather than someone
// using an unlocked screen.
//
// GoTrue has no "verify this password" endpoint, and secure_password_change is
// off in supabase/config.toml (it gates on how recently you signed in, not on
// knowing the password). Re-running signInWithPassword is the check: it fails
// with invalid_credentials on a wrong password, and on success just reissues a
// session for the same user.
export async function changePassword({
  email,
  currentPassword,
  newPassword,
}: {
  email: string
  currentPassword: string
  newPassword: string
}) {
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  })
  if (reauthError) throw reauthError

  await updatePassword(newPassword)
}

// Ends every session for this user, on every device — the companion to a
// password change on a machine you don't control. The current tab is signed
// out too, which onAuthStateChange turns into a redirect to /login.
export async function signOutEverywhere() {
  const { error } = await supabase.auth.signOut({ scope: "global" })
  if (error) throw error
}

// Account settings, from a signed-in session. secure_password_change is off in
// supabase/config.toml, so no re-authentication step is required first.
export async function updateEmail(email: string) {
  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${window.location.origin}/auth/callback` }
  )
  if (error) throw error
}
