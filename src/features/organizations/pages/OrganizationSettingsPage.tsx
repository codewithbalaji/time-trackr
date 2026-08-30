import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCurrentOrganization } from "@/features/organizations/hooks/useCurrentOrganization"
import { useHasPermission } from "@/features/roles/hooks/useHasPermission"
import { TimeSettingsForm } from "@/features/organizations/components/TimeSettingsForm"

export function OrganizationSettingsPage() {
  const membership = useCurrentOrganization()
  const organizationId = membership?.organization.id
  const canManageSettings = useHasPermission(organizationId, "organization.manage_settings")

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

      {canManageSettings && organizationId && membership && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Time settings</CardTitle>
            <CardDescription>
              Change time zone, when your day starts, and your preferred date and time format.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimeSettingsForm organizationId={organizationId} timeSettings={membership.organization} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
