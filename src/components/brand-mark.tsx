import logo from "@/assets/logo.png"
import { cn } from "@/lib/utils"

// The full product logo (icon + wordmark). Its artwork is light-on-transparent
// (designed for the always-dark AuthBrandPanel), so anywhere it can sit on a
// theme-following surface (sidebar, mobile top bar) it gets a small fixed-dark
// chip behind it — otherwise the wordmark disappears in the light theme.
export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn("inline-flex w-fit shrink-0 items-center rounded-md px-2.5 py-1", className)}
      style={{ backgroundColor: "oklch(0.15 0.008 235)" }}
    >
      <img src={logo} alt="Time Trackr" className="h-9 w-auto" />
    </div>
  )
}
