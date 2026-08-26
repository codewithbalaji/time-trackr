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
  const hasErrorInUrl = Boolean(
    searchParams.get("error_description") ?? hashParams.get("error_description")
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

      navigate(isRecovery ? "/reset-password" : "/login", { replace: true })
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
            Request a new confirmation or password reset email and try again.
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
