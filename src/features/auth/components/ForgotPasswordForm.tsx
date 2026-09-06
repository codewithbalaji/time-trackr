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
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/features/auth/schemas/forgot-password.schema"
import { useForgotPassword } from "@/features/auth/hooks/useForgotPassword"

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const forgotPassword = useForgotPassword()
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  function onSubmit(values: ForgotPasswordInput) {
    forgotPassword.mutate(values.email, {
      onSuccess: () => setSentTo(values.email),
    })
  }

  // Replacing the form rather than toasting over it: a live Send button after a
  // successful send invites a second click, which just trips
  // over_email_send_rate_limit and makes it look like the first one failed.
  if (sentTo) {
    return (
      <div className="grid gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-accent">
          <MailCheck className="size-5 text-accent-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Check your email</p>
          <p className="mt-1 text-sm text-muted-foreground">
            If an account exists for {sentTo}, we've sent it a password reset
            link. It expires after a while, so use it soon.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className="text-left text-sm text-muted-foreground hover:underline"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={forgotPassword.isPending}
          className="w-full"
        >
          {forgotPassword.isPending ? "Sending..." : "Send reset link"}
        </Button>
      </form>
    </Form>
  )
}
