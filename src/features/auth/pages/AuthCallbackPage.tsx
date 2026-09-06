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
import { useAuthStore } from "@/features/auth/stores/authStore"

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
  // Two signals, because neither is sufficient alone. The `type=recovery` param
  // only survives because the app puts it in its own redirectTo — GoTrue's PKCE
  // redirect carries just `?code=`, and if the redirect URL isn't in the
  // project's allow-list GoTrue drops it and falls back to the site URL
  // entirely. The PASSWORD_RECOVERY event that authStore records is the part
  // that doesn't depend on the URL surviving the round trip.
  const isRecoveryEvent = useAuthStore((state) => state.isPasswordRecovery)
  const isRecovery =
    isRecoveryEvent ||
    searchParams.get("type") === "recovery" ||
    hashParams.get("type") === "recovery"

  const [state, setState] = useState<CallbackState>(
    hasErrorInUrl ? "invalid" : "verifying"
  )

  // Captured before the effect runs, so it's the session as it was *before*
  // this page tried to establish one.
  const [priorAccessToken] = useState(() => useAuthStore.getState().session?.access_token)
  const hasCode = Boolean(searchParams.get("code"))

  useEffect(() => {
    if (hasErrorInUrl) return

    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        setState("invalid")
        return
      }

      // getSession returns the *stored* session, and a failed PKCE exchange
      // neither clears it nor reports here. Someone already signed in who
      // clicks a dead link would otherwise sail through as though it worked.
      // If a code was present and the session is the one we already had, the
      // exchange didn't happen.
      if (hasCode && data.session.access_token === priorAccessToken) {
        setState("invalid")
        return
      }

      // Only two link types land here now: signup confirmation and password
      // recovery. Invitations no longer route through this page at all — their
      // email links point straight at /invite/accept?token=..., which reads the
      // token from the URL (see supabase/functions/send-invite-email/index.ts).
      //
      // Anything that isn't recovery is a signup confirmation, which always
      // needs onboarding next. A stale/reclicked confirmation link from an
      // already-onboarded user is handled by redirectIfOnboarded on the
      // /onboarding route itself.
      navigate(isRecovery ? "/reset-password" : "/onboarding", {
        replace: true,
      })
    })
  }, [navigate, hasErrorInUrl, isRecovery, hasCode, priorAccessToken])

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
