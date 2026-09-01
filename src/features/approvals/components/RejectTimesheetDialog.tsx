import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import {
  rejectTimesheetSchema,
  type RejectTimesheetInput,
} from "@/features/approvals/schemas/reject-timesheet.schema"
import { useRejectTimesheet } from "@/features/approvals/hooks/useRejectTimesheet"

export function RejectTimesheetDialog({
  organizationId,
  userId,
  periodStart,
}: {
  organizationId: string
  userId: string
  periodStart: string
}) {
  const [open, setOpen] = useState(false)
  const reject = useRejectTimesheet(organizationId)
  const form = useForm<RejectTimesheetInput>({
    resolver: zodResolver(rejectTimesheetSchema),
    defaultValues: { reason: "" },
  })

  function onSubmit(values: RejectTimesheetInput) {
    reject.mutate(
      { userId, periodStart, reason: values.reason },
      {
        onSuccess: () => {
          form.reset()
          setOpen(false)
        },
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) form.reset()
      }}
    >
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Reject
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject this timesheet</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain what needs to change before resubmitting."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={reject.isPending}>
                {reject.isPending ? "Rejecting..." : "Reject"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
