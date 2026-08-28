import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PendingInvitation } from "@/features/users/services/invitation.service"
import { useRevokeInvitation } from "@/features/users/hooks/useRevokeInvitation"
import { useResendInvitation } from "@/features/users/hooks/useResendInvitation"

export function PendingInvitationsList({
  invitations,
  organizationId,
}: {
  invitations: PendingInvitation[]
  organizationId: string
}) {
  const revokeInvitation = useRevokeInvitation(organizationId)
  const resendInvitation = useResendInvitation(organizationId)

  if (invitations.length === 0) return null

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead className="w-48" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell className="font-medium">{invitation.email}</TableCell>
            <TableCell>
              <Badge variant="outline">{invitation.role.name}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {format(new Date(invitation.expires_at), "MMM d, yyyy")}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={resendInvitation.isPending}
                  onClick={() => resendInvitation.mutate(invitation.id)}
                >
                  Resend
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={revokeInvitation.isPending}
                  onClick={() => revokeInvitation.mutate(invitation.id)}
                >
                  Revoke
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
