import { useMemo, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getTimezoneOptions, searchTimezoneOptions } from "@/features/organizations/lib/timezone-options"

// Enterprise-SaaS timezone picker: friendly "(UTC+05:30) India Standard
// Time" / "Asia/Kolkata" two-line rows with a search box over the full IANA
// list, rather than a raw alphabetical dropdown of zone ids. The IANA id
// (e.g. "Asia/Kolkata") is still what's stored/passed as `value`. The
// popover is deliberately wider than the trigger (which lives in a
// constrained form column) so neither line ever needs an ellipsis.
export function TimezoneCombobox({
  value,
  onChange,
  id,
}: {
  value: string
  onChange: (value: string) => void
  id?: string
}) {
  const options = useMemo(() => getTimezoneOptions(), [])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const selected = options.find((option) => option.value === value)
  const filtered = useMemo(() => searchTimezoneOptions(options, query), [options, query])

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setQuery("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-auto w-full min-w-0 justify-between gap-3 py-1.5 font-normal whitespace-normal"
        >
          {selected ? (
            <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
              <span className="w-full">{selected.label}</span>
              <span className="w-full font-mono text-xs text-muted-foreground">
                {selected.value}
              </span>
            </span>
          ) : (
            <span>{value}</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(32rem,90vw)] p-0"
      >
        <div className="border-b border-border p-2">
          <Input
            autoFocus
            placeholder="Search by city, country, or timezone..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div role="listbox" className="max-h-80 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              No timezone found.
            </p>
          ) : (
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                  setQuery("")
                }}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                  option.value === value && "bg-accent"
                )}
              >
                <Check
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    option.value === value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span>{option.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">{option.value}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
