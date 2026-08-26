import { Clock } from "lucide-react"

import { useProfile } from "@/features/auth/hooks/useProfile"

export function DashboardPage() {
  const { data: profile } = useProfile()
  const firstName = profile?.full_name?.split(" ")[0]

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-10">
      <div>
        <h1 className="text-2xl font-medium">
          Welcome{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your time tracking overview will appear here once entries start
          coming in.
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
          <Clock className="size-5 text-accent-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">No time tracked yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Time tracking is coming in an upcoming release — this is where
            your recent entries and totals will show up.
          </p>
        </div>
      </div>
    </div>
  )
}
