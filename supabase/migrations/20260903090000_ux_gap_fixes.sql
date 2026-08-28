-- Closes three non-security UX gaps found in a follow-up review of the
-- suspended-status enforcement:
--
-- 1. accept_invitation() used `on conflict (organization_id, user_id) do
--    nothing`, so re-inviting someone who already has a membership row (most
--    notably a suspended one) silently marked the invitation "accepted"
--    without changing anything — the invitee thinks they joined, the admin
--    thinks the invite worked, and the person stays exactly as suspended as
--    before with no error surfaced anywhere. Not a security bypass (their
--    membership status never changed), just a misleading no-op. Replaced
--    with an explicit pre-check and a clear error — reactivation is meant to
--    go through the existing "Reactivate" action on the Members page, not
--    through re-inviting.
create or replace function public.accept_invitation(p_token uuid)
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invitations;
  v_membership public.memberships;
begin
  select * into v_invite
  from public.invitations
  where token = p_token and status = 'pending'
  for update;

  if not found then
    raise exception 'invitation_not_found' using errcode = 'P0001';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'invitation_expired' using errcode = 'P0001';
  end if;

  if lower(v_invite.email) <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'invitation_email_mismatch' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.memberships
    where organization_id = v_invite.organization_id and user_id = auth.uid()
  ) then
    raise exception 'already_a_member' using errcode = 'P0001';
  end if;

  insert into public.memberships (organization_id, user_id, role_id)
  values (v_invite.organization_id, auth.uid(), v_invite.role_id)
  returning * into v_membership;

  update public.invitations
  set status = 'accepted', accepted_at = now()
  where id = v_invite.id;

  return v_membership;
end;
$$;
