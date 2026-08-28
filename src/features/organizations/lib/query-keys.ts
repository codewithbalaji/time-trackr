export const organizationKeys = {
  memberships: (userId: string | undefined) => ["memberships", userId] as const,
}
