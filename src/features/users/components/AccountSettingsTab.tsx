import { Loader2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useProfile } from "@/features/auth/hooks/useProfile"
import { ProfileForm } from "@/features/users/components/ProfileForm"
import { ChangeEmailForm } from "@/features/users/components/ChangeEmailForm"
import { ChangePasswordForm } from "@/features/users/components/ChangePasswordForm"
import { AppearanceForm } from "@/features/users/components/AppearanceForm"
import { SignOutEverywhere } from "@/features/users/components/SignOutEverywhere"

export function AccountSettingsTab() {
  const { data: profile, isLoading } = useProfile()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading your account...
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
          <CardDescription>This is how you appear to your teammates.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm fullName={profile?.full_name ?? null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email address</CardTitle>
          <CardDescription>
            Changing this needs confirming from both your old and new address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangeEmailForm email={profile?.email ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Confirm your current password, then choose a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* The email is the re-authentication check's other half — without a
              loaded profile there's nothing to verify the current password
              against, so don't offer the form yet. */}
          {profile?.email ? (
            <ChangePasswordForm email={profile.email} />
          ) : (
            <p className="text-sm text-muted-foreground">
              We couldn't load your account details. Refresh the page and try again.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how Time Trackr looks for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <AppearanceForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <SignOutEverywhere />
        </CardContent>
      </Card>
    </div>
  )
}
