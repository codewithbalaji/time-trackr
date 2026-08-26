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

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
