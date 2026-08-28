import { useEffect, useState, type ReactNode } from "react"

import { ThemeContext, type Theme } from "@/hooks/theme-context"

const STORAGE_KEY = "time-trackr-theme"

function getStoredTheme(): Theme {
  return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark"
}

// Scopes light/dark to whatever subtree renders it — used by ProtectedLayout
// so the toggle never reaches AuthLayout's forced-dark auth threshold.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

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

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
