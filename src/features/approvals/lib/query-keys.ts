export const approvalKeys = {
  pending: (organizationId: string | undefined) => ["approvals", "pending", organizationId] as const,
  history: (timesheetId: string | undefined) => ["approvals", "history", timesheetId] as const,
}
