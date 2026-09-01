export const reportKeys = {
  ownEntries: (
    organizationId: string | undefined,
    userId: string | undefined,
    rangeStart: string | undefined,
    rangeEnd: string | undefined
  ) => ["reports", "own-entries", organizationId, userId, rangeStart, rangeEnd] as const,
  orgEntries: (
    organizationId: string | undefined,
    rangeStart: string | undefined,
    rangeEnd: string | undefined
  ) => ["reports", "org-entries", organizationId, rangeStart, rangeEnd] as const,
}
