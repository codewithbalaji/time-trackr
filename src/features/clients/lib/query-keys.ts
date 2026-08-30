export const clientKeys = {
  list: (organizationId: string | undefined) => ["clients", organizationId] as const,
}
