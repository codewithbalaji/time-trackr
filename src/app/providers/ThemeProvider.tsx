import { useCallback, useEffect, useState, type ReactNode } from "react"

import { ThemeContext, type Theme } from "@/hooks/theme-context"
import { useProfile } from "@/features/auth/hooks/useProfile"
import { useUpdateTheme } from "@/features/auth/hooks/useUpdateTheme"

const STORAGE_KEY = "time-trackr-theme"

// localStorage is a cache in front of profiles.theme, not the source of truth.
// The profile is the record that follows a user between devices, but it only
// arrives once the query resolves — reading the cached value synchronously is
// what stops the first paint flashing the wrong theme.
function getCachedTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === "light" || stored === "dark" ? stored : null
  } catch {
    // Private windows and blocked site data both throw here. Losing the cache
    // costs a flash, not correctness.
    return null
  }
}

function cacheTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // See above.
  }
}

// Scopes light/dark to whatever subtree renders it — used by ProtectedLayout
// so the toggle never reaches AuthLayout's forced-dark auth threshold.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data: profile } = useProfile()
  const updateTheme = useUpdateTheme()

  // Set only by an explicit choice in this tab, and only until the profile
  // catches up with it. Everything else is derived rather than synced, so
  // there's no effect racing the query.
  const [chosen, setChosen] = useState<Theme | null>(null)
  const [cached] = useState(getCachedTheme)

  // Precedence: what they just picked here, then what their account says
  // (which is what another device would have written), then the cached value
  // from last time, then the product default.
  const theme: Theme = chosen ?? profile?.theme ?? cached ?? "dark"

  useEffect(() => {
    // Radix portals (dropdown/select content, and any future dialog/popover/
    // tooltip) render into document.body, outside this subtree's own `dark`
    // class — so they'd otherwise always fall back to the light `:root`
    // tokens regardless of the toggle. Mirroring the theme onto the document
    // root fixes that without making the toggle global: AuthLayout forces its
    // own `dark` class directly and doesn't read this, and this effect only
    // runs while ProtectedLayout is mounted.
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  const setTheme = useCallback(
    (next: Theme) => {
      // Applied locally first, then persisted. A failed write shouldn't make
      // the toggle feel broken — worst case the choice doesn't follow them to
      // the next device, and useUpdateTheme says so.
      setChosen(next)
      cacheTheme(next)
      updateTheme.mutate(next)
    },
    [updateTheme]
  )

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
