import { useMutation } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

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
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/features/users/schemas/account.schema"
import { changePassword } from "@/features/auth/services/auth.service"
import { mapAuthError } from "@/features/auth/services/auth-errors"

export function ChangePasswordForm({ email }: { email: string }) {
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  })

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Your password has been updated.")
      form.reset()
    },
    onError: (error: unknown) => {
      // A wrong current password comes back from the re-authentication step as
      // invalid_credentials. Putting it on the field beats a toast that says
      // "incorrect email or password" next to a form with no email in it.
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: string }).code
          : undefined
      if (code === "invalid_credentials") {
        form.setError("currentPassword", { message: "That isn't your current password" })
        return
      }
      toast.error(mapAuthError(error))
    },
  })

  function onSubmit(values: ChangePasswordInput) {
    mutation.mutate({
      email,
      currentPassword: values.currentPassword,
      newPassword: values.password,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
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
              <FormLabel>New password</FormLabel>
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
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending} className="w-fit">
          {mutation.isPending ? "Updating..." : "Update password"}
        </Button>
      </form>
    </Form>
  )
}
