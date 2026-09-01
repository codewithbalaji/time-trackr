import { Button } from '@/components/ui/button'

// Last-resort UI for an uncaught render error anywhere in the tree (wired up
// via Sentry.ErrorBoundary in main.tsx, which also reports the error). Kept
// deliberately minimal — a full reload is the only recovery path that's safe
// regardless of which component broke.
export function ErrorFallback() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
      <div>
        <p className="text-lg font-medium">Something went wrong</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try reloading the page. If this keeps happening, let us know.
        </p>
      </div>
      <Button onClick={() => window.location.reload()}>Reload</Button>
    </div>
  )
}
