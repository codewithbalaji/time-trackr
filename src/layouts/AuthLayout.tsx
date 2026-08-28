import { useEffect } from "react"
import { Outlet } from "react-router"

import { AuthBrandPanel } from "@/features/auth/components/AuthBrandPanel"

export function AuthLayout() {
  useEffect(() => {
    // Same reasoning as ThemeProvider's effect: a Radix portal (any future
    // dialog/popover/tooltip on an auth page) renders into document.body,
    // outside this component's own forced `dark` class, so it needs the
    // document root to carry `dark` too — this layout is always dark
    // regardless of the app's toggle (see DESIGN.md's Dark Threshold Rule),
    // so this is unconditional, not synced to any state.
    document.documentElement.classList.add("dark")
  }, [])

  return (
    <div className="dark flex min-h-svh flex-col bg-background text-foreground lg:flex-row">
      <AuthBrandPanel />
      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}


