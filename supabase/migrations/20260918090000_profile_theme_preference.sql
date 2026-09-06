-- The light/dark choice becomes a user setting rather than a browser setting.
--
-- It was stored only in localStorage, so it was per-browser: signing in on a
-- second device, or in a private window, started over at the default. Storing
-- it on the profile lets it follow the person. localStorage stays as a cache so
-- the first paint doesn't flash the default while the profile query resolves —
-- see src/app/providers/ThemeProvider.tsx.
--
-- No new RLS policy is needed: profiles already has "a user can update their
-- own row", and the prevent_profile_identity_change trigger added in
-- 20260917090000 only guards id and email.
alter table public.profiles
  add column theme text not null default 'dark'
    check (theme in ('light', 'dark'));

comment on column public.profiles.theme is
  'The user''s preferred colour scheme for the authenticated app. Does not affect the auth screens, which are always dark (see DESIGN.md''s Dark Threshold Rule).';
