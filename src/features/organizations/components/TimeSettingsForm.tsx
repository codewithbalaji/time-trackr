import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TimezoneCombobox } from "@/features/organizations/components/TimezoneCombobox"
import {
  updateTimeSettingsSchema,
  type UpdateTimeSettingsInput,
} from "@/features/organizations/schemas/update-time-settings.schema"
import { DATE_FORMAT_VALUES, TIME_FORMAT_VALUES } from "@/features/organizations/lib/date-time-format"
import { detectBrowserTimezone } from "@/features/organizations/lib/timezone-options"
import { useUpdateTimeSettings } from "@/features/organizations/hooks/useUpdateTimeSettings"
import type { MembershipWithOrganization } from "@/features/organizations/services/organization.service"

// Every week/day boundary in the Timesheets feature is computed against
// timezone, so every member of the org sees the same week grid regardless of
// their own browser locale. date_format/time_format govern display only
// (see date-time-format.ts); day_start is stored but not yet wired into any
// calculation — see the Phase 7 follow-up migration's comment.

const TIME_FORMAT_LABELS: Record<(typeof TIME_FORMAT_VALUES)[number], string> = {
  "12h": "12-hour",
  "24h": "24-hour",
}

export function TimeSettingsForm({
  organizationId,
  timeSettings,
}: {
  organizationId: string
  timeSettings: Pick<
    MembershipWithOrganization["organization"],
    "timezone" | "date_format" | "time_format" | "day_start"
  >
}) {
  const updateTimeSettings = useUpdateTimeSettings(organizationId)

  const form = useForm<UpdateTimeSettingsInput>({
    resolver: zodResolver(updateTimeSettingsSchema),
    values: {
      // "UTC" is the column's default, so an org that has never customized
      // this setting still reads as "UTC" — indistinguishable from one that
      // deliberately chose UTC. Preselecting the browser's detected zone in
      // that case (never one already explicitly set to something else) is
      // an intentional, disclosed heuristic, not a live override: saving
      // any other value here permanently clears it on the next load.
      timezone:
        timeSettings.timezone === "UTC" ? (detectBrowserTimezone() ?? "UTC") : timeSettings.timezone,
      dateFormat: timeSettings.date_format,
      timeFormat: timeSettings.time_format,
      dayStart: timeSettings.day_start.slice(0, 5),
    },
  })

  function onSubmit(values: UpdateTimeSettingsInput) {
    updateTimeSettings.mutate(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem className="sm:max-w-96">
              <FormLabel>Time zone</FormLabel>
              <FormControl>
                <TimezoneCombobox
                  id="timezone"
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-md">
          <FormField
            control={form.control}
            name="dateFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date format</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger aria-label="Date format" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DATE_FORMAT_VALUES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="timeFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time format</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger aria-label="Time format" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIME_FORMAT_VALUES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {TIME_FORMAT_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="dayStart"
          render={({ field }) => (
            <FormItem className="sm:max-w-40">
              <FormLabel>Day start</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={updateTimeSettings.isPending || !form.formState.isDirty}
          className="self-start"
        >
          {updateTimeSettings.isPending ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  )
}
