import { Outlet } from "react-router"

import { AuthBrandPanel } from "@/features/auth/components/AuthBrandPanel"

export function AuthLayout() {
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


