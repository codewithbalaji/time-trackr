import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCurrentOrganization } from "@/features/organizations/hooks/useCurrentOrganization"

export function OrganizationSettingsPage() {
  const membership = useCurrentOrganization()

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-10">
      <h1 className="text-2xl font-medium">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your organization.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{membership?.organization.name ?? "Organization"}</CardTitle>
          <CardDescription>
            To manage members and invitations, see the Members page.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
