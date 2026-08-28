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
import { inviteSchema, type InviteInput } from "@/features/organizations/schemas/invite.schema"
import { useCreateInvitation } from "@/features/organizations/hooks/useCreateInvitation"
import { useAuthStore } from "@/features/auth/stores/authStore"

export function CreateInvitationForm({ organizationId }: { organizationId: string }) {
  const userId = useAuthStore((state) => state.session?.user.id)
  const createInvitation = useCreateInvitation()
  const form = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  })

  function onSubmit(values: InviteInput) {
    createInvitation.mutate(
      { organizationId, email: values.email, invitedBy: userId! },
      {
        onSuccess: () => {
          toast.success(`Invitation sent to ${values.email}.`)
          form.reset()
        },
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-3">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="sr-only">Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="teammate@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createInvitation.isPending}>
          {createInvitation.isPending ? "Sending..." : "Send invite"}
        </Button>
      </form>
    </Form>
  )
}
