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
import { ManualEntryForm } from "@/features/time-tracking/components/ManualEntryForm"

export function ManualEntryDialog({
  organizationId,
  userId,
}: {
  organizationId: string
  userId: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="size-4" />
          Add manual entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a manual time entry</DialogTitle>
        </DialogHeader>
        <ManualEntryForm
          organizationId={organizationId}
          userId={userId}
          onCreated={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
