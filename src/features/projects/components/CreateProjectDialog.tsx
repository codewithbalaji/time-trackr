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
import { CreateProjectForm } from "@/features/projects/components/CreateProjectForm"

export function CreateProjectDialog({ organizationId }: { organizationId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Create new project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a project</DialogTitle>
        </DialogHeader>
        <CreateProjectForm organizationId={organizationId} onCreated={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
