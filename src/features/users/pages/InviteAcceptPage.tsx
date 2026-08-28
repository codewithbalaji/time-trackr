import { Loader2, TriangleAlert } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/features/auth/stores/authStore"
import { useInvitation } from "@/features/users/hooks/useInvitation"
import { InviteAcceptForm } from "@/features/users/components/InviteAcceptForm"

function InvalidInviteCard({ description }: { description: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10">
          <TriangleAlert className="size-5 text-destructive" />
        </div>
        <CardTitle className="mt-3">This invitation is invalid</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={() => (window.location.href = "/login")}>
          Back to sign in
        </Button>
      </CardContent>
    </Card>
  )
}

export function InviteAcceptPage() {
  const token = useAuthStore(
    (state) => state.session?.user.user_metadata?.invitation_token as string | undefined
  )
  const { data: invitation, isLoading } = useInvitation(token)

  if (!token) {
    return (
      <InvalidInviteCard description="Use the link from your invitation email to join an organization." />
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading invitation...</p>
        </CardContent>
      </Card>
    )
  }

  if (!invitation || invitation.status !== "pending") {
    return (
      <InvalidInviteCard description="This invitation has already been used, revoked, or does not exist." />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join {invitation.organization_name}</CardTitle>
        <CardDescription>
          Set your name and password to finish setting up your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InviteAcceptForm
          token={token}
          email={invitation.email}
          organizationName={invitation.organization_name}
        />
      </CardContent>
    </Card>
  )
}
