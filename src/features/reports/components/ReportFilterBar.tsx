import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangePicker } from "@/features/reports/components/DateRangePicker"
import type { DateRange, DateRangePresetKey } from "@/features/reports/lib/date-range-presets"
import type { Project } from "@/features/projects/services/project.service"
import type { Client } from "@/features/clients/services/client.service"
import type { OrgMember } from "@/features/users/services/membership.service"

const ALL_VALUE = "__all__"

// Live-apply filter bar (no separate pending/applied state — see the Phase 9
// plan). Project/client options reuse the existing projects/clients hooks;
// the member select only renders when the caller has confirmed
// timesheets.approve (see ReportsPage).
export function ReportFilterBar({
  range,
  preset,
  onPresetChange,
  onCustomRangeChange,
  projects,
  clients,
  members,
  projectId,
  clientId,
  userId,
  onProjectChange,
  onClientChange,
  onUserChange,
  showMemberFilter,
}: {
  range: DateRange
  preset: DateRangePresetKey | "custom"
  onPresetChange: (key: DateRangePresetKey) => void
  onCustomRangeChange: (range: DateRange) => void
  projects: Project[]
  clients: Client[]
  members: OrgMember[]
  projectId: string | null
  clientId: string | null
  userId: string | null
  onProjectChange: (projectId: string | null) => void
  onClientChange: (clientId: string | null) => void
  onUserChange: (userId: string | null) => void
  showMemberFilter: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangePicker
        value={range}
        preset={preset}
        onPresetChange={onPresetChange}
        onCustomChange={onCustomRangeChange}
      />
      <FilterSelect
        placeholder="All projects"
        value={projectId}
        onChange={onProjectChange}
        options={projects.map((project) => ({ value: project.id, label: project.name }))}
      />
      <FilterSelect
        placeholder="All clients"
        value={clientId}
        onChange={onClientChange}
        options={clients.map((client) => ({ value: client.id, label: client.name }))}
      />
      {showMemberFilter && (
        <FilterSelect
          placeholder="All members"
          value={userId}
          onChange={onUserChange}
          options={members.map((member) => ({
            value: member.profile.id,
            label: member.profile.full_name ?? member.profile.email,
          }))}
        />
      )}
    </div>
  )
}

function FilterSelect({
  placeholder,
  value,
  onChange,
  options,
}: {
  placeholder: string
  value: string | null
  onChange: (value: string | null) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Select value={value ?? ALL_VALUE} onValueChange={(next) => onChange(next === ALL_VALUE ? null : next)}>
      <SelectTrigger size="sm" className="w-40">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
