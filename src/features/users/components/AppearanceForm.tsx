import { Moon, Sun } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/use-theme"
import type { Theme } from "@/hooks/theme-context"

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
]

// Two explicit options rather than the sidebar's single toggle button: in
// settings the point is to see which one is selected, not to flip it blind.
//
// Saved to the profile (see ThemeProvider), so it follows the user to their
// next device. It applies to the authenticated app only — the sign-in screens
// are always dark, per DESIGN.md's Dark Threshold Rule.
export function AppearanceForm() {
  const { theme, setTheme } = useTheme()

  return (
    <fieldset className="grid gap-3">
      <legend className="sr-only">Colour scheme</legend>
      <div role="radiogroup" aria-label="Colour scheme" className="flex gap-3">
        {OPTIONS.map((option) => {
          const selected = theme === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(option.value)}
              className={cn(
                "flex flex-1 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                selected
                  ? "border-primary bg-accent font-medium"
                  : "border-border hover:bg-muted"
              )}
            >
              <option.icon className="size-4" />
              {option.label}
            </button>
          )
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        Applies across your devices. Sign-in screens are always dark.
      </p>
    </fieldset>
  )
}
