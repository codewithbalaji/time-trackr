export const projectKeys = {
  list: (organizationId: string | undefined) => ["projects", organizationId] as const,
  members: (projectId: string | undefined) => ["project-members", projectId] as const,
}
