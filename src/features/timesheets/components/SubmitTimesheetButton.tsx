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
import { useSubmitTimesheet } from "@/features/timesheets/hooks/useSubmitTimesheet"
import { useWithdrawTimesheet } from "@/features/timesheets/hooks/useWithdrawTimesheet"
import { useResubmitTimesheet } from "@/features/timesheets/hooks/useResubmitTimesheet"
import type { Timesheet } from "@/features/timesheets/services/timesheet.service"

export function SubmitTimesheetButton({
  organizationId,
  userId,
  periodStart,
  status,
  rejectionReason,
}: {
  organizationId: string
  userId: string
  periodStart: string
  status: Timesheet["status"]
  rejectionReason?: string | null
}) {
  const [confirming, setConfirming] = useState(false)
  const submit = useSubmitTimesheet(organizationId, userId, periodStart)
  const withdraw = useWithdrawTimesheet(organizationId, userId, periodStart)
  const resubmit = useResubmitTimesheet(organizationId, userId, periodStart)

  if (status === "submitted") {
    return (
      <Button variant="outline" onClick={() => withdraw.mutate()} disabled={withdraw.isPending}>
        {withdraw.isPending ? "Withdrawing..." : "Withdraw"}
      </Button>
    )
  }

  // Approved weeks are final — no action available here (see the lock
  // trigger, which now also blocks entry edits for this status).
  if (status === "approved") {
    return null
  }

  if (status === "rejected") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        {rejectionReason && (
          <p className="max-w-xs text-right text-sm text-muted-foreground">{rejectionReason}</p>
        )}
        <Button onClick={() => resubmit.mutate()} disabled={resubmit.isPending}>
          {resubmit.isPending ? "Resubmitting..." : "Resubmit"}
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button onClick={() => setConfirming(true)} disabled={submit.isPending}>
        Submit
      </Button>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this timesheet?</AlertDialogTitle>
            <AlertDialogDescription>
              Once submitted, entries in this week can't be added, edited, or deleted until you
              withdraw it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => submit.mutate()}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
