import { create } from "zustand"

const STORAGE_KEY = "currentOrganizationId"

type OrganizationState = {
  currentOrganizationId: string | null
}

function readStoredOrganizationId(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

// Which organization is active in this browser tab — deliberately NOT
// persisted server-side or in localStorage. Product decision: every fresh
// login re-shows the organization picker rather than remembering a choice
// (see docs/decisions/0003-multi-organization-selection.md), so there's
// nothing to sync across devices or logins. sessionStorage means a reload
// keeps the current pick (so the dashboard doesn't bounce back to the
// picker on every refresh), but a new tab or a fresh sign-in starts empty.
export const useOrganizationStore = create<OrganizationState>(() => ({
  currentOrganizationId: readStoredOrganizationId(),
}))

export function setCurrentOrganizationId(organizationId: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, organizationId)
  } catch {
    // Ignore (private browsing, storage disabled, etc.) — the in-memory
    // store still updates; it just won't survive a reload.
  }
  useOrganizationStore.setState({ currentOrganizationId: organizationId })
}

export function clearCurrentOrganizationId() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  useOrganizationStore.setState({ currentOrganizationId: null })
}
