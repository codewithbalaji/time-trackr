import { useState } from "react"
import { Play, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProjects } from "@/features/projects/hooks/useProjects"
import { useRunningTimeEntry } from "@/features/time-tracking/hooks/useRunningTimeEntry"
import { useStartTimer } from "@/features/time-tracking/hooks/useStartTimer"
import { useStopTimer } from "@/features/time-tracking/hooks/useStopTimer"
import { useElapsedSeconds } from "@/features/time-tracking/hooks/useElapsedSeconds"
import { formatDuration } from "@/features/time-tracking/lib/format-duration"

export function TimerBar({
  organizationId,
  userId,
}: {
  organizationId: string
  userId: string
}) {
  const { data: projects } = useProjects(organizationId)
  const activeProjects = projects?.filter((project) => project.status === "active") ?? []
  const { data: runningEntry } = useRunningTimeEntry(organizationId, userId)
  const startTimer = useStartTimer(organizationId, userId)
  const stopTimer = useStopTimer(organizationId, userId)
  const elapsedSeconds = useElapsedSeconds(runningEntry?.start_time)
  const isRunning = !!runningEntry

  const [description, setDescription] = useState(runningEntry?.description ?? "")
  const [projectId, setProjectId] = useState<string | undefined>(runningEntry?.project.id)

  // Reflects the running entry (including one started elsewhere, e.g. via a
  // row's restart action) in the bar, and clears back to blank once stopped.
  // Adjusted synchronously during render (React's documented pattern for
  // resetting state when a prop changes) rather than in an effect, since the
  // reset must land before this render commits, not one tick after it.
  const [trackedRunningEntry, setTrackedRunningEntry] = useState(runningEntry)
  if (runningEntry !== trackedRunningEntry) {
    setTrackedRunningEntry(runningEntry)
    setDescription(runningEntry?.description ?? "")
    setProjectId(runningEntry?.project.id)
  }

  function handleStart() {
    if (!projectId || !description.trim()) return
    startTimer.mutate({ organizationId, projectId, description: description.trim() })
  }

  function handleStop() {
    if (!runningEntry) return
    stopTimer.mutate(runningEntry.id)
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center">
      <Input
        placeholder="What are you working on?"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        disabled={isRunning}
        className="flex-1"
      />
      <Select value={projectId} onValueChange={setProjectId} disabled={isRunning}>
        <SelectTrigger aria-label="Project" className="w-full sm:w-48">
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          {activeProjects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              <span className="flex items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: project.color }}
                  aria-hidden="true"
                />
                {project.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center justify-end gap-3">
        <span className="w-20 text-right font-mono text-sm tabular-nums">
          {formatDuration(elapsedSeconds)}
        </span>
        {isRunning ? (
          <Button variant="destructive" onClick={handleStop} disabled={stopTimer.isPending}>
            <Square className="size-4" />
            Stop
          </Button>
        ) : (
          <Button
            onClick={handleStart}
            disabled={startTimer.isPending || !projectId || !description.trim()}
          >
            <Play className="size-4" />
            Start
          </Button>
        )}
      </div>
    </div>
  )
}
