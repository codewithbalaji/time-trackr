import { useEffect, useState, type ReactNode } from "react"
import { NavLink, Outlet, useNavigate } from "react-router"
import { toast } from "sonner"
import {
  ArrowLeftRight,
  BarChart3,
  Clock,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BrandMark } from "@/components/brand-mark"
import { ThemeProvider } from "@/app/providers/ThemeProvider"
import { useTheme } from "@/hooks/use-theme"
import { useLogout } from "@/features/auth/hooks/useLogout"
import { useProfile } from "@/features/auth/hooks/useProfile"
import { useCurrentOrganization } from "@/features/organizations/hooks/useCurrentOrganization"
import { useHasPermission } from "@/features/roles/hooks/useHasPermission"

type NavItem = {
  label: string
  icon: typeof LayoutDashboard
  to?: string
  // Route is guarded server-side by requirePermission() (see router.tsx) —
  // this just keeps the nav from linking a plain Member to a page that will
  // immediately bounce them back to "/" with no explanation.
  permissionKey?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Time Tracking", icon: Clock },
  { label: "Projects", icon: FolderKanban },
  { label: "Timesheets", icon: ListChecks },
  { label: "Reports", icon: BarChart3 },
  { label: "Team", to: "/members", icon: Users },
  {
    label: "Settings",
    to: "/settings",
    icon: Settings,
    permissionKey: "organization.manage_settings",
  },
]

export function ProtectedLayout() {
  return (
    <ThemeProvider>
      <ProtectedShell />
    </ThemeProvider>
  )
}

function ProtectedShell() {
  const { theme } = useTheme()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (!mobileNavOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileNavOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [mobileNavOpen])

  return (
    <div
      className={cn(
        "flex min-h-svh bg-background text-foreground",
        theme === "dark" && "dark"
      )}
    >
      <Sidebar className="hidden lg:flex" />

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <Sidebar
            className="absolute inset-y-0 left-0 flex w-72"
            onNavigate={() => setMobileNavOpen(false)}
            trailingAction={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close navigation"
                onClick={() => setMobileNavOpen(false)}
              >
                <X className="size-4" />
              </Button>
            }
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open navigation"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <BrandMark />
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function Sidebar({
  className,
  onNavigate,
  trailingAction,
}: {
  className?: string
  onNavigate?: () => void
  trailingAction?: ReactNode
}) {
  const navigate = useNavigate()
  const { data: profile } = useProfile()
  const currentOrganization = useCurrentOrganization()
  const canManageSettings = useHasPermission(
    currentOrganization?.organization.id,
    "organization.manage_settings"
  )
  const logout = useLogout()
  const { theme, toggleTheme } = useTheme()
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.permissionKey || canManageSettings
  )

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast.success("Signed out successfully.")
        navigate("/login")
      },
    })
  }

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? profile?.email?.[0]?.toUpperCase() ?? "?"

  return (
    <div
      className={cn(
        "z-50 w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <div className="flex h-14 items-center justify-between px-4">
        <BrandMark />
        {trailingAction}
      </div>

      <Separator className="bg-sidebar-border" />

      {currentOrganization && (
        <>
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {currentOrganization.organization.name}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Switch organization"
              onClick={() => {
                onNavigate?.()
                navigate("/select-organization")
              }}
            >
              <ArrowLeftRight className="size-4" />
            </Button>
          </div>
          <Separator className="bg-sidebar-border" />
        </>
      )}

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {visibleNavItems.map((item) => {
          const Icon = item.icon

          if (!item.to) {
            return (
              <div
                key={item.label}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/40"
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="size-4" />
                  {item.label}
                </span>
                <span className="rounded-full border border-sidebar-border px-1.5 py-0.5 text-[0.65rem] tracking-wide text-sidebar-foreground/40 uppercase">
                  Soon
                </span>
              </div>
            )
          }

          return (
            <NavLink
              key={item.label}
              to={item.to}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )
              }
            >
              <Icon className="size-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      <div className="flex items-center gap-2.5 p-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {profile?.full_name ?? "Your account"}
          </p>
          <p className="truncate text-xs text-sidebar-foreground/50">
            {profile?.email}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Sign out"
          disabled={logout.isPending}
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  )
}
