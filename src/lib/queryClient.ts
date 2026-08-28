import { QueryClient } from "@tanstack/react-query"

// A module-level singleton (rather than one created inside QueryProvider) so
// router loaders — which run outside the component tree — can share the same
// cache as components via `queryClient.ensureQueryData(...)`.
export const queryClient = new QueryClient()
