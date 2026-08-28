export const roleKeys = {
  list: (organizationId: string | undefined) => ["roles", organizationId] as const,
  permission: (organizationId: string | undefined, permissionKey: string) =>
    ["has-permission", organizationId, permissionKey] as const,
  mine: (organizationId: string | undefined, userId: string | undefined) =>
    ["my-permissions", organizationId, userId] as const,
}
