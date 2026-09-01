import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  className,
}: {
  label: string
  value: ReactNode
  description?: string
  icon: LucideIcon
  className?: string
}) {
  return (
    <Card className={cn(className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-medium">{value}</p>
          {description && (
            <p className="mt-1 truncate text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent">
          <Icon className="size-4 text-accent-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}
