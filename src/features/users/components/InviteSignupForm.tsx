import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { MailCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  inviteAcceptSchema,
  type InviteAcceptInput,
} from "@/features/users/schemas/invite-accept.schema"
import { useSignup } from "@/features/auth/hooks/useSignup"

// Account creation for an invitee who doesn't have one yet.
//
// This creates a normal account rather than completing a GoTrue invite: the
// invitation itself is accepted separately, from the invitation token in the
// URL, once they're signed in. Email confirmation still applies (
// auth.email.enable_confirmations), so there's no session immediately after
// this — hence the "check your email" state below.
//
// That confirmation link is single-use, but unlike the old invite link it's
// scanner-safe in effect: if a mail gateway pre-fetches it, the only thing that
// happens is the address gets confirmed, and the invitee can sign in with the
// password they just chose and pick the invitation up from there.
export function InviteSignupForm({ token, email }: { token: string; email: string }) {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const signup = useSignup()
  const form = useForm<InviteAcceptInput>({
    resolver: zodResolver(inviteAcceptSchema),
    defaultValues: { fullName: "", password: "", confirmPassword: "" },
  })

  function onSubmit(values: InviteAcceptInput) {
    signup.mutate(
      {
        email,
        password: values.password,
        fullName: values.fullName,
        redirectPath: `/invite/accept?token=${token}`,
      },
      { onSuccess: () => setSubmittedEmail(email) }
    )
  }

  if (submittedEmail) {
    return (
      <div className="grid gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-accent">
          <MailCheck className="size-5 text-accent-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Confirm your email</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a confirmation link to {submittedEmail}. Click it and you'll
            come straight back here to join the organization.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Email</span>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={signup.isPending} className="w-full">
          {signup.isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </Form>
  )
}
