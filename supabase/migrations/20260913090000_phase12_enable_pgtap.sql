-- Phase 12: enable pgTAP so RLS/authorization policies can be exercised by
-- real SQL tests (`supabase test db`) against the actual database roles and
-- policies, instead of only through mocked service-layer unit tests. Inert
-- in production — it only adds testing functions to the `extensions` schema,
-- which is already on every role's search_path.
create extension if not exists pgtap with schema extensions;
