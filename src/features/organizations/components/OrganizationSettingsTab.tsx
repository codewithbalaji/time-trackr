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
import { OrganizationNameForm } from "@/features/organizations/components/OrganizationNameForm"

// Readable by every member, editable only with organization.manage_settings.
//
// The route used to be gated on that permission, which locked Admins out
// entirely (the RBAC seed deliberately withholds manage_settings from Admin) —
// so nobody but an Owner could see even their own organization's timezone or
// date format. Read access to settings everyone works under isn't the thing
// that needed protecting; the write is, and RLS enforces that independently.
export function OrganizationSettingsTab({ organizationId }: { organizationId: string }) {
  const membership = useCurrentOrganization()
  const canManageSettings = useHasPermission(organizationId, "organization.manage_settings")

  if (!membership) return null
  const organization = membership.organization

  return (
    <div className="grid gap-6">
      {!canManageSettings && (
        <p className="text-sm text-muted-foreground">
          These are your organization's settings. Only an owner can change them.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            To manage members and invitations, see the Members page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canManageSettings ? (
            <OrganizationNameForm organizationId={organizationId} name={organization.name} />
          ) : (
            <div className="grid gap-1.5">
              <span className="text-sm font-medium">Organization name</span>
              <p className="text-sm text-muted-foreground">{organization.name}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time settings</CardTitle>
          <CardDescription>
            Time zone, when your day starts, and your preferred date and time
            format. These apply to everyone in the organization, so a week looks
            the same to all of you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canManageSettings ? (
            <TimeSettingsForm organizationId={organizationId} timeSettings={organization} />
          ) : (
            <dl className="grid gap-3 text-sm">
              <div className="grid gap-0.5">
                <dt className="font-medium">Time zone</dt>
                <dd className="text-muted-foreground">{organization.timezone}</dd>
              </div>
              <div className="grid gap-0.5">
                <dt className="font-medium">Date format</dt>
                <dd className="text-muted-foreground">{organization.date_format}</dd>
              </div>
              <div className="grid gap-0.5">
                <dt className="font-medium">Time format</dt>
                <dd className="text-muted-foreground">
                  {organization.time_format === "12h" ? "12-hour" : "24-hour"}
                </dd>
              </div>
              <div className="grid gap-0.5">
                <dt className="font-medium">Day starts at</dt>
                <dd className="text-muted-foreground">{organization.day_start.slice(0, 5)}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
