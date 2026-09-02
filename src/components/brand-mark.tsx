import logoBlack from "@/assets/timetrackr-black.png"
import logoWhite from "@/assets/TimeTrackr-white.png"
import { useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"

// The full product logo (icon + wordmark). Its artwork ships as separate
// black- and white-wordmark variants so it stays legible on both themes
// without a fixed background chip behind it.
export function BrandMark({ className }: { className?: string }) {
  const { theme } = useTheme()

  return (
    <div className={cn("inline-flex w-fit shrink-0 items-center", className)}>
      <img
        src={theme === "dark" ? logoWhite : logoBlack}
        alt="Time Trackr"
        className="h-9 w-auto"
      />
    </div>
  )
}
