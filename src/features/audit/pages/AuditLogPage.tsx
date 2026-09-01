import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCurrentOrganization } from "@/features/organizations/hooks/useCurrentOrganization"
import { useAuditLogs } from "@/features/audit/hooks/useAuditLogs"
import { AuditLogList } from "@/features/audit/components/AuditLogList"

const PAGE_SIZE = 20

export function AuditLogPage() {
  const membership = useCurrentOrganization()
  const organizationId = membership?.organization.id
  const [limit, setLimit] = useState(PAGE_SIZE)

  const { data: entries, isLoading } = useAuditLogs(organizationId, { limit })

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-10">
      <div>
        <h1 className="text-2xl font-medium">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A record of who changed what, and when, across your organization.
        </p>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogList entries={entries} isLoading={isLoading} />
          {entries && entries.length >= limit && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" size="sm" onClick={() => setLimit((current) => current + PAGE_SIZE)}>
                Load more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
