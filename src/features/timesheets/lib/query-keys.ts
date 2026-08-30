export const timesheetKeys = {
  detail: (
    organizationId: string | undefined,
    userId: string | undefined,
    periodStart: string | undefined
  ) => ["timesheets", organizationId, userId, periodStart] as const,
  entries: (
    organizationId: string | undefined,
    userId: string | undefined,
    periodStart: string | undefined
  ) => ["timesheets", "entries", organizationId, userId, periodStart] as const,
}
