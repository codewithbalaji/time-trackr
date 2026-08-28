import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { Loader2, TriangleAlert } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type CallbackState = "verifying" | "invalid"

// Supabase's client automatically exchanges the URL's code/hash for a session
// on load (detectSessionInUrl: true, the default). This page's job is just to
// wait for that, then branch on what kind of link was clicked.
export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  // GoTrue doesn't always send `error_description` (some error paths only set
  // `error`/`error_code`), so check all three rather than just the one.
  const hasErrorInUrl = Boolean(
    searchParams.get("error_description") ??
      searchParams.get("error_code") ??
      searchParams.get("error") ??
      hashParams.get("error_description") ??
      hashParams.get("error_code") ??
      hashParams.get("error")
  )
  const isRecovery =
    searchParams.get("type") === "recovery" || hashParams.get("type") === "recovery"

  const [state, setState] = useState<CallbackState>(
    hasErrorInUrl ? "invalid" : "verifying"
  )

  useEffect(() => {
    if (hasErrorInUrl) return

    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        setState("invalid")
        return
      }

      // The `type=invite` URL param isn't reliable here: Supabase's PKCE auth
      // flow redirects with only `?code=...`, dropping `type`. The invite
      // Edge Function stamps `invitation_token` into user_metadata via
      // inviteUserByEmail's `data` option, which survives on the session
      // regardless of flow type, so that's the signal we key off instead.
      const isInvite = Boolean(data.session.user?.user_metadata?.invitation_token)

      // Only three link types ever land here: signup confirmation, password
      // recovery, and org invites — everything else is a fresh signup
      // confirmation, which always needs onboarding next. A stale/reclicked
      // confirmation link from an already-onboarded user is handled by
      // redirectIfOnboarded on the /onboarding route itself.
      navigate(isRecovery ? "/reset-password" : isInvite ? "/invite/accept" : "/onboarding", {
        replace: true,
      })
    })
  }, [navigate, hasErrorInUrl, isRecovery])

  if (state === "invalid") {
    return (
      <Card>
        <CardHeader>
          <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10">
            <TriangleAlert className="size-5 text-destructive" />
          </div>
          <CardTitle className="mt-3">This link is invalid or has expired</CardTitle>
          <CardDescription>
            Email confirmation, password reset, and team invitation links only
            work once and expire after a while. If you were confirming your
            email or resetting your password, sign in or use "Forgot
            password" to request a new link. If you were accepting a team
            invitation, ask whoever invited you to resend it from their
            organization's Members page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => navigate("/login")}>
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Verifying your link</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please wait a moment.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
