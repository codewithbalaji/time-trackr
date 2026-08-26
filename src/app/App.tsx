import { useEffect } from "react"
import { RouterProvider } from "react-router"
import { Toaster } from "@/components/ui/sonner"

import { QueryProvider } from "@/app/providers/QueryProvider"
import { router } from "@/app/router"
import { initAuthStore, useAuthStore } from "@/features/auth/stores/authStore"

export function App() {
  const status = useAuthStore((state) => state.status)

  useEffect(() => {
    initAuthStore()
  }, [])

  return (
    <QueryProvider>
      {status === "loading" ? null : <RouterProvider router={router} />}
      <Toaster />
    </QueryProvider>
  )
}
