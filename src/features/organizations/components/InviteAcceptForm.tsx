import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router"
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
  inviteAcceptSchema,
  type InviteAcceptInput,
} from "@/features/organizations/schemas/invite-accept.schema"
import { useAcceptInvitation } from "@/features/organizations/hooks/useAcceptInvitation"
import { supabase } from "@/lib/supabase"

export function InviteAcceptForm({
  token,
  email,
  organizationName,
}: {
  token: string
  email: string
  organizationName: string
}) {
  const navigate = useNavigate()
  const acceptInvitation = useAcceptInvitation()
  const form = useForm<InviteAcceptInput>({
    resolver: zodResolver(inviteAcceptSchema),
    defaultValues: { fullName: "", password: "", confirmPassword: "" },
  })

  async function onSubmit(values: InviteAcceptInput) {
    const { error } = await supabase.auth.updateUser({
      password: values.password,
      data: { full_name: values.fullName },
    })
    if (error) {
      toast.error("Something went wrong. Please try again.")
      return
    }

    acceptInvitation.mutate(token, {
      onSuccess: () => navigate("/", { replace: true }),
    })
  }

  const isSubmitting = form.formState.isSubmitting || acceptInvitation.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Email</span>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Organization</span>
          <p className="text-sm text-muted-foreground">{organizationName}</p>
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
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Joining..." : "Join organization"}
        </Button>
      </form>
    </Form>
  )
}
