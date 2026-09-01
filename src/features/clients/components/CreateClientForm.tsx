import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { clientSchema, type ClientInput } from "@/features/clients/schemas/client.schema"
import { useCreateClient } from "@/features/clients/hooks/useCreateClient"
import { useAuthStore } from "@/features/auth/stores/authStore"

export function CreateClientForm({
  organizationId,
  onCreated,
}: {
  organizationId: string
  onCreated?: () => void
}) {
  const userId = useAuthStore((state) => state.session?.user.id)
  const createClient = useCreateClient(organizationId)
  const form = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "" },
  })

  function onSubmit(values: ClientInput) {
    createClient.mutate(
      { organizationId, name: values.name, createdBy: userId! },
      {
        onSuccess: () => {
          toast.success(`${values.name} added.`)
          form.reset()
          onCreated?.()
        },
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Client name</FormLabel>
              <FormControl>
                <Input placeholder="Client name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createClient.isPending} className="self-end">
          {createClient.isPending ? "Adding..." : "Add client"}
        </Button>
      </form>
    </Form>
  )
}
