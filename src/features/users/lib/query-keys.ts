export const invitationKeys = {
  byToken: (token: string | undefined) => ["invitation", token] as const,
}

export const userKeys = {
  members: (organizationId: string | undefined) => ["org-members", organizationId] as const,
  invitations: (organizationId: string | undefined) => ["org-invitations", organizationId] as const,
}
