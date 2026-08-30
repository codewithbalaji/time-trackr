import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CreateClientForm } from "@/features/clients/components/CreateClientForm"

export function CreateClientDialog({ organizationId }: { organizationId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a client</DialogTitle>
        </DialogHeader>
        <CreateClientForm organizationId={organizationId} onCreated={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
