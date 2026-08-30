import { TriangleAlert } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentOrganization } from "@/features/organizations/hooks/useCurrentOrganization"
import { useClients } from "@/features/clients/hooks/useClients"
import { CreateClientDialog } from "@/features/clients/components/CreateClientDialog"
import { ClientsTable } from "@/features/clients/components/ClientsTable"
import { useHasPermission } from "@/features/roles/hooks/useHasPermission"

export function ClientsPage() {
  const membership = useCurrentOrganization()
  const organizationId = membership?.organization.id
  const canManageClients = useHasPermission(organizationId, "clients.manage")
  const { data: clients, isLoading, isError } = useClients(organizationId)

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The clients your projects are organized under.
          </p>
        </div>
        {canManageClients && organizationId && (
          <CreateClientDialog organizationId={organizationId} />
        )}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-destructive/40 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
                <TriangleAlert className="size-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium">Couldn't load clients</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Something went wrong loading the directory. Try refreshing the page.
                </p>
              </div>
            </div>
          ) : (
            <ClientsTable
              clients={clients ?? []}
              isLoading={isLoading}
              organizationId={organizationId!}
              canManageClients={canManageClients}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
