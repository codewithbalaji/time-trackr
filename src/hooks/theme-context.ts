import { createContext } from "react"

export type Theme = "light" | "dark"

export type ThemeContextValue = {
  theme: Theme
  // setTheme for an explicit choice (the Appearance setting shows both options
  // at once); toggleTheme for the sidebar's single-button flip.
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
