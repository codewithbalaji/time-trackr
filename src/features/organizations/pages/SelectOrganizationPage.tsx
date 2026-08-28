import { useNavigate } from "react-router"
import { Building2, UserX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useMemberships } from "@/features/organizations/hooks/useMemberships"
import { setCurrentOrganizationId } from "@/features/organizations/stores/organizationStore"
import { CreateOrganizationForm } from "@/features/organizations/components/CreateOrganizationForm"

export function SelectOrganizationPage() {
  const navigate = useNavigate()
  const { data: memberships } = useMemberships()

  function selectOrganization(organizationId: string) {
    setCurrentOrganizationId(organizationId)
    navigate("/", { replace: true })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select an organization</CardTitle>
        <CardDescription>Choose where you want to work, or create a new one.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-1.5">
          {memberships?.map((membership) =>
            membership.status === "suspended" ? (
              <div
                key={membership.id}
                aria-disabled="true"
                className="flex items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2.5 text-left text-sm opacity-60"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <UserX className="size-4 text-accent-foreground" />
                </div>
                <span className="flex-1 truncate font-medium">
                  {membership.organization.name}
                </span>
                <Badge variant="destructive">Suspended</Badge>
              </div>
            ) : (
              <button
                key={membership.id}
                type="button"
                onClick={() => selectOrganization(membership.organization.id)}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <Building2 className="size-4 text-accent-foreground" />
                </div>
                <span className="flex-1 truncate font-medium">
                  {membership.organization.name}
                </span>
                <span className="rounded-full border border-border px-1.5 py-0.5 text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                  {membership.role.name}
                </span>
              </button>
            )
          )}
        </div>

        <Separator />

        <div>
          <p className="mb-2 text-sm font-medium">Create a new organization</p>
          <CreateOrganizationForm />
        </div>
      </CardContent>
    </Card>
  )
}
