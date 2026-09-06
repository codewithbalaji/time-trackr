import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
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
  changeEmailSchema,
  type ChangeEmailInput,
} from "@/features/users/schemas/account.schema"
import { updateEmail } from "@/features/auth/services/auth.service"
import { mapAuthError } from "@/features/auth/services/auth-errors"

export function ChangeEmailForm({ email }: { email: string }) {
  const changeEmail = useMutation({
    mutationFn: updateEmail,
    onError: (error: unknown) => toast.error(mapAuthError(error)),
  })
  const form = useForm<ChangeEmailInput>({
    resolver: zodResolver(changeEmailSchema),
    values: { email },
  })

  function onSubmit(values: ChangeEmailInput) {
    changeEmail.mutate(values.email, {
      onSuccess: () => {
        // double_confirm_changes is on in supabase/config.toml, so both the old
        // and the new address have to confirm before the change takes effect.
        // Nothing changes in the app until they do — say so, rather than
        // reporting success and leaving the old address on screen.
        toast.success(
          "Check both your old and new email for a confirmation link. Your address changes once both are confirmed."
        )
        form.reset({ email: values.email })
      },
    })
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
          disabled={changeEmail.isPending || !form.formState.isDirty}
          className="w-fit"
        >
          {changeEmail.isPending ? "Sending..." : "Change email"}
        </Button>
      </form>
    </Form>
  )
}
