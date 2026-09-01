import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentOrganization } from "@/features/organizations/hooks/useCurrentOrganization"
import { ReviewQueueTable } from "@/features/approvals/components/ReviewQueueTable"

export function ApprovalsPage() {
  const membership = useCurrentOrganization()
  const organizationId = membership?.organization.id
  const timezone = membership?.organization.timezone

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-10">
      <div>
        <h1 className="text-2xl font-medium">Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review timesheets submitted by your team.
        </p>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Review queue</CardTitle>
        </CardHeader>
        <CardContent>
          {organizationId && timezone && (
            <ReviewQueueTable organizationId={organizationId} timezone={timezone} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
