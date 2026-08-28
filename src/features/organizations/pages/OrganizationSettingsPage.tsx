import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCurrentOrganization } from "@/features/organizations/hooks/useCurrentOrganization"
import { CreateInvitationForm } from "@/features/organizations/components/CreateInvitationForm"

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
            {membership?.role === "owner"
              ? "Invite a teammate by email. They'll get a link to join."
              : "Only the organization owner can invite new members."}
          </CardDescription>
        </CardHeader>
        {membership?.role === "owner" && (
          <CardContent>
            <CreateInvitationForm organizationId={membership.organization.id} />
          </CardContent>
        )}
      </Card>
    </div>
  )
}
