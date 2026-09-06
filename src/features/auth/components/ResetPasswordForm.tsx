import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useNavigate } from "react-router"

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
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/features/auth/schemas/reset-password.schema"
import { useResetPassword } from "@/features/auth/hooks/useResetPassword"
import { clearPasswordRecovery } from "@/features/auth/stores/authStore"

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const resetPassword = useResetPassword()
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  function onSubmit(values: ResetPasswordInput) {
    resetPassword.mutate(values.password, {
      onSuccess: () => {
        toast.success("Your password has been updated.")
        // The recovery flag has done its job routing this link; leaving it set
        // would make a later visit to /reset-password in the same session look
        // like another recovery.
        clearPasswordRecovery()
        // A recovery link establishes a full session, and updateUser refreshes
        // it — so the user is signed in by this point. Sending them to /login
        // just bounced them through redirectIfAuthenticated to "/" and on to
        // the organization picker. Go to "/" and let the guards route.
        navigate("/", { replace: true })
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...field}
                />
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
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={resetPassword.isPending}
          className="w-full"
        >
          {resetPassword.isPending ? "Updating..." : "Update password"}
        </Button>
      </form>
    </Form>
  )
}
