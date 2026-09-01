import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { inviteSchema, type InviteInput } from "@/features/users/schemas/invite.schema"
import { useCreateInvitation } from "@/features/users/hooks/useCreateInvitation"
import { useRoles } from "@/features/roles/hooks/useRoles"
import { useAuthStore } from "@/features/auth/stores/authStore"

export function CreateInvitationForm({ organizationId }: { organizationId: string }) {
  const userId = useAuthStore((state) => state.session?.user.id)
  const createInvitation = useCreateInvitation()
  const { data: roles } = useRoles(organizationId)
  // Owner is never an invitable role — it's assigned once, to the org's creator.
  const assignableRoles = useMemo(
    () => roles?.filter((role) => role.name !== "Owner") ?? [],
    [roles]
  )
  const form = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", roleId: "" },
  })

  useEffect(() => {
    if (form.getValues("roleId")) return
    const memberRole = assignableRoles.find((role) => role.name === "Member")
    if (memberRole) form.setValue("roleId", memberRole.id)
  }, [assignableRoles, form])

  function onSubmit(values: InviteInput) {
    createInvitation.mutate(
      { organizationId, email: values.email, roleId: values.roleId, invitedBy: userId! },
      {
        onSuccess: () => {
          toast.success(`Invitation sent to ${values.email}.`)
          form.resetField("email")
        },
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex items-start gap-3">
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
        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Role</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger aria-label="Role">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assignableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
