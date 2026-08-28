import { useMyPermissions } from "@/features/roles/hooks/useMyPermissions"

// Frontend authorization is a UX convenience (hide/disable actions the user
// can't perform) — the database RLS policies and RPC permission checks are the
// real security boundary, not this hook. Defaults to false while loading/absent
// so gated actions stay hidden rather than flashing on before the check resolves.
// A pure derived selector over useMyPermissions' single shared query, not its
// own network call — see that hook for why.
export function useHasPermission(organizationId: string | undefined, permissionKey: string) {
  const { data: permissions } = useMyPermissions(organizationId)
  return permissions?.includes(permissionKey) ?? false
}
