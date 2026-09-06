import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

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
import { Button } from "@/components/ui/button"
import { signOutEverywhere } from "@/features/auth/services/auth.service"
import { mapAuthError } from "@/features/auth/services/auth-errors"
import { clearCurrentOrganizationId } from "@/features/organizations/stores/organizationStore"

// Ends every session for this account, this tab included. Confirmed first
// because it's disruptive rather than dangerous — nothing is lost, but every
// other device gets kicked out mid-work.
export function SignOutEverywhere() {
  const [confirming, setConfirming] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: signOutEverywhere,
    onSuccess: () => {
      // Same teardown as a normal sign-out: the org pick is tab-scoped and
      // nothing else clears it, and the query cache outlives the session.
      clearCurrentOrganizationId()
      queryClient.clear()
      toast.success("Signed out on all devices.")
    },
    onError: (error: unknown) => toast.error(mapAuthError(error)),
  })

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Ends your session on every device, including this one. Worth doing
          after changing your password on a shared computer.
        </p>
        <Button
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => setConfirming(true)}
        >
          {mutation.isPending ? "Signing out..." : "Sign out everywhere"}
        </Button>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out on all devices?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll be signed out here too and will need to sign in again. Any
              timer running on another device keeps running — it just won't be
              visible until that device signs back in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                mutation.mutate()
                setConfirming(false)
              }}
            >
              Sign out everywhere
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
