export const organizationKeys = {
  memberships: (userId: string | undefined) => ["memberships", userId] as const,
}

export const invitationKeys = {
  byToken: (token: string | undefined) => ["invitation", token] as const,
}
