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
import type { Timesheet } from "@/features/timesheets/services/timesheet.service"

export function SubmitTimesheetButton({
  organizationId,
  userId,
  periodStart,
  status,
}: {
  organizationId: string
  userId: string
  periodStart: string
  status: Timesheet["status"]
}) {
  const [confirming, setConfirming] = useState(false)
  const submit = useSubmitTimesheet(organizationId, userId, periodStart)
  const withdraw = useWithdrawTimesheet(organizationId, userId, periodStart)

  // No approver exists until Phase 8, so withdrawing is the only way an
  // employee can unlock their own submitted week for now.
  if (status === "submitted") {
    return (
      <Button variant="outline" onClick={() => withdraw.mutate()} disabled={withdraw.isPending}>
        {withdraw.isPending ? "Withdrawing..." : "Withdraw"}
      </Button>
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
