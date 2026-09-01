export const notificationKeys = {
  list: (organizationId: string | undefined) => ["notifications", "list", organizationId] as const,
  recent: (organizationId: string | undefined) => ["notifications", "recent", organizationId] as const,
  unreadCount: (organizationId: string | undefined) =>
    ["notifications", "unread-count", organizationId] as const,
}
