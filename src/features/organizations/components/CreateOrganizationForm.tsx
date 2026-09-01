import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "@/features/organizations/schemas/create-organization.schema"
import { useCreateOrganization } from "@/features/organizations/hooks/useCreateOrganization"

export function CreateOrganizationForm() {
  const navigate = useNavigate()
  const createOrganization = useCreateOrganization()
  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: { organizationName: "" },
  })

  function onSubmit(values: CreateOrganizationInput) {
    createOrganization.mutate(values.organizationName, {
      onSuccess: () => navigate("/", { replace: true }),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex items-start gap-3">
        <FormField
          control={form.control}
          name="organizationName"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="sr-only">Organization name</FormLabel>
              <FormControl>
                <Input autoComplete="organization" placeholder="Organization name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createOrganization.isPending}>
          {createOrganization.isPending ? "Creating..." : "Create"}
        </Button>
      </form>
    </Form>
  )
}
