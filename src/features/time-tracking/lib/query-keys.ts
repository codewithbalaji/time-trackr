export const timeEntryKeys = {
  list: (organizationId: string | undefined, userId: string | undefined) =>
    ["time-entries", organizationId, userId] as const,
  running: (organizationId: string | undefined, userId: string | undefined) =>
    ["time-entries", "running", organizationId, userId] as const,
}
