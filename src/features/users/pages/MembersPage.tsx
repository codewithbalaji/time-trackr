import { TriangleAlert } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCurrentOrganization } from "@/features/organizations/hooks/useCurrentOrganization"
import { useOrgMembers } from "@/features/users/hooks/useOrgMembers"
import { usePendingInvitations } from "@/features/users/hooks/usePendingInvitations"
import { MembersTable } from "@/features/users/components/MembersTable"
import { PendingInvitationsList } from "@/features/users/components/PendingInvitationsList"
import { CreateInvitationForm } from "@/features/users/components/CreateInvitationForm"
import { useHasPermission } from "@/features/roles/hooks/useHasPermission"

export function MembersPage() {
  const membership = useCurrentOrganization()
  const organizationId = membership?.organization.id
  const canInvite = useHasPermission(organizationId, "members.invite")
  const canManageMembers = useHasPermission(organizationId, "members.remove")
  const {
    data: members,
    isLoading: membersLoading,
    isError: membersErrored,
  } = useOrgMembers(organizationId)
  // Not gated on canInvite: fetching starts in parallel with everything else
  // above, rather than waiting on that permission check to resolve first. RLS
  // already returns zero rows for a caller without members.invite, and the
  // "canInvite &&" below hides the card regardless of what comes back.
  const { data: invitations } = usePendingInvitations(organizationId)

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-10">
      <h1 className="text-2xl font-medium">Members</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        People in {membership?.organization.name ?? "your organization"}.
      </p>

      {canInvite && organizationId && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Invite a teammate</CardTitle>
            <CardDescription>They'll get an email with a link to join.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateInvitationForm organizationId={organizationId} />
          </CardContent>
        </Card>
      )}

      {canInvite && invitations && invitations.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <PendingInvitationsList invitations={invitations} organizationId={organizationId!} />
          </CardContent>
        </Card>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {membersErrored ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-destructive/40 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
                <TriangleAlert className="size-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium">Couldn't load members</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Something went wrong loading the directory. Try refreshing the page.
                </p>
              </div>
            </div>
          ) : (
            <MembersTable
              members={members ?? []}
              isLoading={membersLoading}
              organizationId={organizationId!}
              canManageMembers={canManageMembers}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
