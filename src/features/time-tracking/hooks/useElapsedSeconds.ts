import { useEffect, useState } from "react"

// Ticks off the shared running-entry query's start_time locally — the
// running entry itself lives in Postgres/React Query (so it survives a
// refresh or a closed browser), this just re-renders its display every
// second. No Zustand store needed for that: see AGENTS.md's "prefer local
// state + TanStack Query cache first" guidance.
export function useElapsedSeconds(startTime: string | null | undefined): number {
  const [elapsed, setElapsed] = useState(() => computeElapsed(startTime))

  // Recompute synchronously during render when startTime changes (e.g. a
  // timer starts/stops elsewhere) rather than in the effect below — the
  // effect's job is only to subscribe to the ongoing per-second tick.
  const [trackedStartTime, setTrackedStartTime] = useState(startTime)
  if (startTime !== trackedStartTime) {
    setTrackedStartTime(startTime)
    setElapsed(computeElapsed(startTime))
  }

  useEffect(() => {
    if (!startTime) return
    const interval = setInterval(() => setElapsed(computeElapsed(startTime)), 1000)
    return () => clearInterval(interval)
  }, [startTime])

  return elapsed
}

function computeElapsed(startTime: string | null | undefined): number {
  if (!startTime) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000))
}
