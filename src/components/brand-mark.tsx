import { cn } from "@/lib/utils"

// Shared clock glyph + wordmark. The full glowing product logo (src/assets/logo.png)
// only reads clearly at hero size (see AuthBrandPanel) — this crisp drawn mark is
// used everywhere else the brand needs to be small and legible (sidebar, etc).
export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6 shrink-0 text-primary">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M12 7v5l3.5 2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-heading text-base font-medium">Time Trackr</span>
    </div>
  )
}
