import { useState } from "react"
import { format } from "date-fns"
import { Loader2, MoreHorizontal, Users } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { OrgMember } from "@/features/users/services/membership.service"
import { useUpdateMembershipStatus } from "@/features/users/hooks/useUpdateMembershipStatus"
import { useRemoveMember } from "@/features/users/hooks/useRemoveMember"
import { useRoles } from "@/features/roles/hooks/useRoles"
import { useAssignRole } from "@/features/roles/hooks/useAssignRole"
import { useHasPermission } from "@/features/roles/hooks/useHasPermission"
import { useAuthStore } from "@/features/auth/stores/authStore"

type PendingSuspend = { member: OrgMember }
type PendingRemoval = { member: OrgMember }
type PendingRoleChange = { member: OrgMember; roleId: string; roleName: string }

export function MembersTable({
  members,
  isLoading,
  organizationId,
  canManageMembers,
}: {
  members: OrgMember[]
  isLoading: boolean
  organizationId: string
  canManageMembers: boolean
}) {
  const currentUserId = useAuthStore((state) => state.session?.user.id)
  const updateStatus = useUpdateMembershipStatus(organizationId)
  const removeMember = useRemoveMember(organizationId)
  const assignRole = useAssignRole(organizationId)
  const { data: roles } = useRoles(organizationId)
  const canAssignRoles = useHasPermission(organizationId, "roles.assign")
  const assignableRoles = roles?.filter((role) => role.name !== "Owner") ?? []

  // Reactivating is low-stakes to click by accident (it only grants access
  // back), so only suspend/remove/role-change — the ones that take access
  // away or change what someone can do — go through a confirmation step.
  // These actions can't be undone by the person who clicked them, only by
  // another admin, so a stray click matters.
  const [pendingSuspend, setPendingSuspend] = useState<PendingSuspend | null>(null)
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null)
  const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading members...
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
          <Users className="size-5 text-accent-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">No members yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Invite a teammate above to add them to this organization.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            {canManageMembers && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const isOwner = member.role.name === "Owner"
            const isSelf = member.profile.id === currentUserId
            return (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.profile.full_name ?? "—"}
                  {isSelf && <span className="ml-1.5 text-muted-foreground">(you)</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{member.profile.email}</TableCell>
                <TableCell>
                  {canAssignRoles && !isOwner && !isSelf ? (
                    <Select
                      value={member.role.id}
                      onValueChange={(roleId) => {
                        const role = assignableRoles.find((r) => r.id === roleId)
                        if (role) setPendingRoleChange({ member, roleId, roleName: role.name })
                      }}
                    >
                      <SelectTrigger size="sm" aria-label={`Role for ${member.profile.email}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{member.role.name}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={member.status === "active" ? "outline" : "destructive"}>
                    {member.status === "active" ? "Active" : "Suspended"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(member.created_at), "MMM d, yyyy")}
                </TableCell>
                {canManageMembers && (
                  <TableCell>
                    {!isOwner && !isSelf && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Member actions">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              if (member.status === "active") {
                                setPendingSuspend({ member })
                              } else {
                                updateStatus.mutate({ membershipId: member.id, status: "active" })
                              }
                            }}
                          >
                            {member.status === "active" ? "Suspend" : "Reactivate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingRemoval({ member })}
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <AlertDialog
        open={pendingSuspend !== null}
        onOpenChange={(open) => !open && setPendingSuspend(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend {pendingSuspend?.member.profile.full_name ?? "this member"}?</AlertDialogTitle>
            <AlertDialogDescription>
              They'll immediately lose access to this organization until someone
              reactivates them. They can stay suspended for as long as you need.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingSuspend) {
                  updateStatus.mutate({ membershipId: pendingSuspend.member.id, status: "suspended" })
                }
                setPendingSuspend(null)
              }}
            >
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {pendingRemoval?.member.profile.full_name ?? "this member"} from the organization?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone from here — they'll lose access immediately, and
              rejoining requires a brand new invitation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingRemoval) removeMember.mutate(pendingRemoval.member.id)
                setPendingRemoval(null)
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingRoleChange !== null}
        onOpenChange={(open) => !open && setPendingRoleChange(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Change {pendingRoleChange?.member.profile.full_name ?? "this member"}'s role to{" "}
              {pendingRoleChange?.roleName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This changes what they're allowed to do in this organization right away.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRoleChange) {
                  assignRole.mutate({
                    membershipId: pendingRoleChange.member.id,
                    roleId: pendingRoleChange.roleId,
                  })
                }
                setPendingRoleChange(null)
              }}
            >
              Change role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
