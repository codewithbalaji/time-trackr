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

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile()

  return (
    <div className="mx-auto max-w-xl p-6 lg:p-10">
      <h1 className="text-2xl font-medium">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your account details.</p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your details</CardTitle>
          <CardDescription>This is how you appear to your teammates.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading profile...
            </div>
          ) : (
            <ProfileForm fullName={profile?.full_name ?? null} email={profile?.email ?? ""} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
