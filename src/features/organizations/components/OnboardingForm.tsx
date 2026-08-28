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
  onboardingSchema,
  type OnboardingInput,
} from "@/features/organizations/schemas/onboarding.schema"
import { useCreateOrganization } from "@/features/organizations/hooks/useCreateOrganization"
import { supabase } from "@/lib/supabase"

export function OnboardingForm() {
  const navigate = useNavigate()
  const createOrganization = useCreateOrganization()
  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { fullName: "", organizationName: "" },
  })

  async function onSubmit(values: OnboardingInput) {
    await supabase.auth.updateUser({ data: { full_name: values.fullName } })
    createOrganization.mutate(values.organizationName, {
      onSuccess: () => navigate("/", { replace: true }),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
          disabled={createOrganization.isPending}
          className="w-full"
        >
          {createOrganization.isPending ? "Setting up..." : "Continue"}
        </Button>
      </form>
    </Form>
  )
}
