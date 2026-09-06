import { useState } from "react"
import { Link } from "react-router"
import { MailCheck } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SignupForm } from "@/features/auth/components/SignupForm"

export function SignupPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  if (submittedEmail) {
    return (
      <Card>
        <CardHeader>
          <div className="flex size-9 items-center justify-center rounded-lg bg-accent">
            <MailCheck className="size-5 text-accent-foreground" />
          </div>
          <CardTitle className="mt-3">Check your email</CardTitle>
          {/*
            Deliberately hedged. With email confirmations on, GoTrue returns
            success for an address that already has an account (it won't confirm
            or deny who's registered), and no new email is sent — so promising
            "we sent you a link" left returning users waiting for mail that was
            never coming.
          */}
          <CardDescription>
            If <strong className="font-medium text-foreground">{submittedEmail}</strong> doesn't
            already have an account, we've sent it a confirmation link — click it
            to activate. Already registered?{" "}
            <Link to="/login" className="text-foreground hover:underline">
              Sign in
            </Link>{" "}
            instead.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Wrong address?{" "}
            <button
              type="button"
              onClick={() => setSubmittedEmail(null)}
              className="text-foreground hover:underline"
            >
              Try again
            </button>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your details to get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <SignupForm onSubmitted={setSubmittedEmail} />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
