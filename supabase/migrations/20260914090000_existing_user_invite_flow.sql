-- Fixes inviting someone who already has an account (in this org or another
-- one). send-invite-email always calls GoTrue's admin.inviteUserByEmail(),
-- which tries to create a brand-new auth account and fails with
-- "email_exists" for anyone who already has one — see
-- src/features/organizations/services/organization-errors.ts's
-- email_exists/user_already_exists mapping. accept_invitation() already
-- worked for an already-authenticated invitee (it matches on auth.jwt()
-- email, not on account creation), so the only real gaps were: (1) an
-- invitee couldn't SELECT invitations addressed to them unless they were
-- also an owner of that org, and (2) there was no decline path. The Edge
-- Function itself is updated separately to stop treating "already has an
-- account" as a hard failure.

create policy "Invitees can view pending invitations sent to their email"
  on public.invitations for select
  using (
    status = 'pending'
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

alter table public.invitations drop constraint invitations_status_check;
alter table public.invitations add constraint invitations_status_check
  check (status in ('pending', 'accepted', 'revoked', 'declined'));

create or replace function public.decline_invitation(p_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invitations;
begin
  select * into v_invite
  from public.invitations
  where token = p_token and status = 'pending'
  for update;

  if not found then
    raise exception 'invitation_not_found' using errcode = 'P0001';
  end if;

  if lower(v_invite.email) <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'invitation_email_mismatch' using errcode = 'P0001';
  end if;

  update public.invitations
  set status = 'declined'
  where id = v_invite.id;
end;
$$;
