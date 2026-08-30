import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { Building2, Loader2, MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { clientSchema, type ClientInput } from "@/features/clients/schemas/client.schema"
import type { Client } from "@/features/clients/services/client.service"
import { useUpdateClient } from "@/features/clients/hooks/useUpdateClient"
import { useSetClientStatus } from "@/features/clients/hooks/useSetClientStatus"

export function ClientsTable({
  clients,
  isLoading,
  organizationId,
  canManageClients,
}: {
  clients: Client[]
  isLoading: boolean
  organizationId: string
  canManageClients: boolean
}) {
  const updateClient = useUpdateClient(organizationId)
  const setStatus = useSetClientStatus(organizationId)
  const [renaming, setRenaming] = useState<Client | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading clients...
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
          <Building2 className="size-5 text-accent-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">No clients yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Add a client above to start grouping projects under it.
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
            <TableHead>Status</TableHead>
            <TableHead>Added</TableHead>
            {canManageClients && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>
                <Badge variant={client.status === "active" ? "outline" : "secondary"}>
                  {client.status === "active" ? "Active" : "Archived"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(client.created_at), "MMM d, yyyy")}
              </TableCell>
              {canManageClients && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Client actions">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setRenaming(client)}>
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          setStatus.mutate({
                            clientId: client.id,
                            status: client.status === "active" ? "archived" : "active",
                          })
                        }
                      >
                        {client.status === "active" ? "Archive" : "Restore"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <RenameClientDialog
        client={renaming}
        onOpenChange={(open) => !open && setRenaming(null)}
        onSubmit={(name) => {
          if (renaming) updateClient.mutate({ clientId: renaming.id, name })
          setRenaming(null)
        }}
      />
    </>
  )
}

function RenameClientDialog({
  client,
  onOpenChange,
  onSubmit,
}: {
  client: Client | null
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string) => void
}) {
  const form = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    values: { name: client?.name ?? "" },
  })

  return (
    <Dialog open={client !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename client</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => onSubmit(values.name))}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
