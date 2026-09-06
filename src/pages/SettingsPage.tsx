import { Loader2 } from "lucide-react"
import { useSearchParams } from "react-router"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrentOrganization } from "@/features/organizations/hooks/useCurrentOrganization"
import { useMemberships } from "@/features/organizations/hooks/useMemberships"
import { OrganizationSettingsTab } from "@/features/organizations/components/OrganizationSettingsTab"
import { AccountSettingsTab } from "@/features/users/components/AccountSettingsTab"

// Lives in src/pages rather than in a feature because it belongs to neither:
// it composes the organizations feature's settings with the users feature's
// account settings (see docs/architecture.md).

const TABS = ["organization", "account"] as const
type SettingsTab = (typeof TABS)[number]

function isSettingsTab(value: string | null): value is SettingsTab {
  return TABS.includes(value as SettingsTab)
}

export function SettingsPage() {
  // The tab lives in the URL so it can be linked to and survives a refresh —
  // /profile redirects to ?tab=account, and the sidebar's account row points
  // there too. `replace` because flipping tabs isn't a navigation someone
  // wants to walk back through with the Back button.
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get("tab")
  const tab: SettingsTab = isSettingsTab(requested) ? requested : "organization"

  const membership = useCurrentOrganization()
  const { isLoading } = useMemberships()
  const organizationId = membership?.organization.id

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-10">
      <h1 className="text-2xl font-medium">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your organization and your account.
      </p>

      <Tabs
        value={tab}
        onValueChange={(next) => setSearchParams({ tab: next }, { replace: true })}
        className="mt-8 gap-6"
      >
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          {isLoading || !organizationId ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading settings...
            </div>
          ) : (
            <OrganizationSettingsTab organizationId={organizationId} />
          )}
        </TabsContent>

        <TabsContent value="account">
          <AccountSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
