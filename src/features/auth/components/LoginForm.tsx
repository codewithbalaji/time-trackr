import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Link, useNavigate } from "react-router"

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
import { loginSchema, type LoginInput } from "@/features/auth/schemas/login.schema"
import { useLogin } from "@/features/auth/hooks/useLogin"

export function LoginForm() {
  const navigate = useNavigate()
  const login = useLogin()
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  function onSubmit(values: LoginInput) {
    login.mutate(values, {
      onSuccess: () => {
        toast.success("Signed in successfully.")
        // Always through the organization picker on a fresh login (even with
        // just one org) — see docs/decisions/0003-multi-organization-selection.md.
        // requireOrganization would otherwise send them here anyway once it
        // sees no selection for this session, but going there directly skips
        // an extra redirect hop.
        navigate("/select-organization")
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  to="/forgot-password"
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={login.isPending} className="w-full">
          {login.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Form>
  )
}
