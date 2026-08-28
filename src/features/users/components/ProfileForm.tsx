import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
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
import { profileSchema, type ProfileInput } from "@/features/users/schemas/profile.schema"
import { useUpdateProfile } from "@/features/auth/hooks/useUpdateProfile"

export function ProfileForm({
  fullName,
  email,
}: {
  fullName: string | null
  email: string
}) {
  const updateProfile = useUpdateProfile()
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: fullName ?? "" },
  })

  useEffect(() => {
    form.reset({ fullName: fullName ?? "" })
  }, [fullName, form])

  function onSubmit(values: ProfileInput) {
    updateProfile.mutate(values.fullName)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Email</span>
          <p className="text-sm text-muted-foreground">{email}</p>
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
        <Button type="submit" disabled={updateProfile.isPending} className="w-fit">
          {updateProfile.isPending ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </Form>
  )
}
