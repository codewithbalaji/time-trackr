import { Loader2, Mail, TriangleAlert } from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router"

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
import { useAcceptInvitation } from "@/features/users/hooks/useAcceptInvitation"
import { useLogout } from "@/features/auth/hooks/useLogout"
import { InviteSignupForm } from "@/features/users/components/InviteSignupForm"

function InviteMessageCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10">
          <TriangleAlert className="size-5 text-destructive" />
        </div>
        <CardTitle className="mt-3">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children ?? (
          <Button className="w-full" asChild>
            <Link to="/login">Back to sign in</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// The invitation landing page. Reached from the emailed link, which carries the
// invitations row's own token in the URL — deliberately not a GoTrue
// verification link, whose single use was being consumed by corporate mail
// scanners before the invitee ever clicked (see
// supabase/functions/send-invite-email/index.ts).
//
// The route is public: an invitee usually has no account yet, and the ones who
// do still need somewhere to be told to sign in.
export function InviteAcceptPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? undefined
  const session = useAuthStore((state) => state.session)
  const { data: invitation, isLoading, isError } = useInvitation(token)
  const acceptInvitation = useAcceptInvitation()
  const logout = useLogout()

  if (!token) {
    return (
      <InviteMessageCard
        title="This invitation link is incomplete"
        description="Use the link from your invitation email to join an organization."
      />
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

  if (isError) {
    return (
      <InviteMessageCard
        title="We couldn't load this invitation"
        description="Something went wrong reaching the server. Check your connection and try the link again."
      />
    )
  }

  if (!invitation) {
    return (
      <InviteMessageCard
        title="This invitation is invalid"
        description="This invitation does not exist. Ask whoever invited you to send a new one."
      />
    )
  }

  if (invitation.status !== "pending") {
    return (
      <InviteMessageCard
        title="This invitation is no longer active"
        description={
          invitation.status === "accepted"
            ? "It has already been accepted. Sign in to reach your organization."
            : "It has been revoked. Ask whoever invited you to send a new one."
        }
      />
    )
  }

  // Expiry is checked here as well as inside accept_invitation, so an invitee
  // who is out of time is told so up front instead of after filling in a form.
  if (new Date(invitation.expires_at) <= new Date()) {
    return (
      <InviteMessageCard
        title="This invitation has expired"
        description="Invitations are valid for 7 days. Ask whoever invited you to resend it from their organization's Members page."
      />
    )
  }

  const signedInEmail = session?.user.email

  if (signedInEmail && signedInEmail.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <InviteMessageCard
        title="This invitation is for a different account"
        description={`It was sent to ${invitation.email}, but you're signed in as ${signedInEmail}. Sign out and use the invited address.`}
      >
        <Button
          className="w-full"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {logout.isPending ? "Signing out..." : "Sign out"}
        </Button>
      </InviteMessageCard>
    )
  }

  if (session) {
    return (
      <Card>
        <CardHeader>
          <div className="flex size-9 items-center justify-center rounded-lg bg-accent">
            <Mail className="size-5 text-accent-foreground" />
          </div>
          <CardTitle className="mt-3">Join {invitation.organization_name}</CardTitle>
          <CardDescription>
            You've been invited as {invitation.role_name}. Accepting adds this
            organization to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            disabled={acceptInvitation.isPending}
            onClick={() =>
              acceptInvitation.mutate(token, {
                onSuccess: () => navigate("/", { replace: true }),
              })
            }
          >
            {acceptInvitation.isPending ? "Joining..." : "Accept invitation"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join {invitation.organization_name}</CardTitle>
        <CardDescription>
          You've been invited as {invitation.role_name}. Create your account to
          get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <InviteSignupForm token={token} email={invitation.email} />
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to={`/login?redirect=${encodeURIComponent(`/invite/accept?token=${token}`)}`}
            className="text-primary hover:underline"
          >
            Sign in
          </Link>{" "}
          to accept it.
        </p>
      </CardContent>
    </Card>
  )
}
