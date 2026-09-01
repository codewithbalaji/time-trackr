import { useState } from "react"

import { Button } from "@/components/ui/button"
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
import { useApproveTimesheet } from "@/features/approvals/hooks/useApproveTimesheet"

export function ApproveTimesheetButton({
  organizationId,
  userId,
  periodStart,
}: {
  organizationId: string
  userId: string
  periodStart: string
}) {
  const [confirming, setConfirming] = useState(false)
  const approve = useApproveTimesheet(organizationId)

  return (
    <>
      <Button size="sm" onClick={() => setConfirming(true)} disabled={approve.isPending}>
        Approve
      </Button>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this timesheet?</AlertDialogTitle>
            <AlertDialogDescription>
              This locks the week permanently — entries can no longer be added, edited, or
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => approve.mutate({ userId, periodStart })}>
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
