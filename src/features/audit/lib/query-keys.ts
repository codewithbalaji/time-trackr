export const auditKeys = {
  list: (organizationId: string | undefined) => ["audit-logs", "list", organizationId] as const,
}
