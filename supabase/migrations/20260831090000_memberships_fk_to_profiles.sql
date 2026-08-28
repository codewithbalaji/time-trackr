-- memberships.user_id pointed at auth.users(id), which PostgREST can't embed
-- through (the `auth` schema isn't exposed to the Data API) — so a select
-- like `.from("memberships").select("profile:profiles(...)")` failed outright
-- with "Could not find a relationship between 'memberships' and 'profiles'".
-- Repoint the FK at public.profiles(id) instead, which is what
-- listOrgMembers() actually needs to embed. Safe: profiles.id is 1:1 with
-- auth.users.id via the handle_new_user trigger (see
-- docs/decisions/0001-*.md), so every existing membership row already
-- satisfies this constraint.
alter table public.memberships
  drop constraint memberships_user_id_fkey,
  add constraint memberships_user_id_fkey
    foreign key (user_id) references public.profiles (id) on delete cascade;
