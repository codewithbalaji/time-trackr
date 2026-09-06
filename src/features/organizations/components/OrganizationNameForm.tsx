import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

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
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "@/features/organizations/schemas/create-organization.schema"
import { useUpdateOrganizationName } from "@/features/organizations/hooks/useUpdateOrganizationName"

// Reuses createOrganizationSchema rather than declaring a second one: it's the
// same field with the same rules, and the trim/length limits have to match what
// the organizations table's check constraint enforces either way.
export function OrganizationNameForm({
  organizationId,
  name,
}: {
  organizationId: string
  name: string
}) {
  const updateName = useUpdateOrganizationName(organizationId)
  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    values: { organizationName: name },
  })

  function onSubmit(values: CreateOrganizationInput) {
    updateName.mutate(values.organizationName)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <FormField
          control={form.control}
          name="organizationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization name</FormLabel>
              <FormControl>
                <Input autoComplete="organization" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={updateName.isPending || !form.formState.isDirty}
          className="w-fit"
        >
          {updateName.isPending ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </Form>
  )
}
