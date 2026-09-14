SET local check_function_bodies = off;

COMMENT ON COLUMN "public"."timesheets"."rejection_reason" IS NULL;

COMMENT ON COLUMN "public"."timesheets"."reviewed_by" IS NULL;

DROP POLICY "Members with timesheets.approve can view any timesheet in their" ON "public"."timesheets";

ALTER TABLE "public"."timesheets"
  DROP CONSTRAINT "timesheets_rejection_reason_check";

CREATE OR REPLACE FUNCTION public.accept_invitation (
  p_token uuid
)
  RETURNS public.memberships
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.approve_timesheet (
  p_organization_id uuid,
  p_user_id         uuid,
  p_period_start    date
)
  RETURNS public.timesheets
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_timesheet public.timesheets;
begin
  if not public.has_permission(p_organization_id, 'timesheets.approve') then
    raise exception 'insufficient_permissions' using errcode = 'P0001';
  end if;

  update public.timesheets
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), rejection_reason = null
  where organization_id = p_organization_id
    and user_id = p_user_id
    and period_start = p_period_start
    and status = 'submitted'
  returning * into v_timesheet;

  if not found then
    raise exception 'not_pending_approval' using errcode = 'P0001';
  end if;

  perform public.create_notification(
    p_organization_id, v_timesheet.user_id, auth.uid(), 'timesheet_approved',
    'timesheets', v_timesheet.id, '/timesheets',
    'Your timesheet was approved', null, '{}'::jsonb
  );

  return v_timesheet;
end;
$function$;

CREATE OR REPLACE FUNCTION public.assign_membership_role (
  p_membership_id uuid,
  p_role_id       uuid
)
  RETURNS public.memberships
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_organization_id uuid;
  v_target_user_id uuid;
  v_current_role_name text;
  v_new_role_name text;
  v_owner_count int;
  v_membership public.memberships;
begin
  select m.organization_id, m.user_id, r.name
  into v_organization_id, v_target_user_id, v_current_role_name
  from public.memberships m
  join public.roles r on r.id = m.role_id
  where m.id = p_membership_id;

  if v_organization_id is null then
    raise exception 'membership_not_found' using errcode = 'P0001';
  end if;

  if not public.has_permission(v_organization_id, 'roles.assign') then
    raise exception 'insufficient_permissions' using errcode = 'P0001';
  end if;

  if v_target_user_id = auth.uid() then
    raise exception 'cannot_change_own_role' using errcode = 'P0001';
  end if;

  select name into v_new_role_name
  from public.roles
  where id = p_role_id and organization_id = v_organization_id;

  if v_new_role_name is null then
    raise exception 'role_not_found' using errcode = 'P0001';
  end if;

  if (v_current_role_name = 'Owner' or v_new_role_name = 'Owner')
    and not public.is_org_owner(v_organization_id) then
    raise exception 'only_owner_can_manage_owner_role' using errcode = 'P0001';
  end if;

  if v_current_role_name = 'Owner' and v_new_role_name <> 'Owner' then
    select count(*) into v_owner_count
    from public.memberships m
    join public.roles r on r.id = m.role_id
    where m.organization_id = v_organization_id
      and r.name = 'Owner'
      and m.status = 'active';

    if v_owner_count <= 1 then
      raise exception 'cannot_remove_last_owner' using errcode = 'P0001';
    end if;
  end if;

  perform set_config('app.bypass_role_guard', 'on', true);

  update public.memberships
  set role_id = p_role_id
  where id = p_membership_id
  returning * into v_membership;

  insert into public.audit_logs (organization_id, actor_id, action, target_type, target_id, metadata)
  values (v_organization_id, auth.uid(), 'role_assigned', 'membership', p_membership_id,
          jsonb_build_object('role_id', p_role_id));

  return v_membership;
end;
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_target_membership (
  p_membership_id uuid
)
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_organization_id uuid;
  v_target_user_id uuid;
  v_role_name text;
  v_owner_count int;
begin
  select m.organization_id, m.user_id, r.name
  into v_organization_id, v_target_user_id, v_role_name
  from public.memberships m
  join public.roles r on r.id = m.role_id
  where m.id = p_membership_id;

  if v_organization_id is null then
    return false;
  end if;

  if v_target_user_id = auth.uid() then
    return false;
  end if;

  if v_role_name = 'Owner' then
    if not public.is_org_owner(v_organization_id) then
      return false;
    end if;

    select count(*) into v_owner_count
    from public.memberships m
    join public.roles r on r.id = m.role_id
    where m.organization_id = v_organization_id
      and r.name = 'Owner'
      and m.status = 'active';

    if v_owner_count <= 1 then
      return false;
    end if;
  end if;

  return true;
end;
$function$;

CREATE OR REPLACE FUNCTION public.check_time_entry_not_locked()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
begin
  if tg_op in ('UPDATE', 'DELETE')
    and public.is_time_entry_period_locked(old.organization_id, old.user_id, old.start_time) then
    raise exception 'time_entry_locked' using errcode = 'P0001';
  end if;

  if tg_op in ('INSERT', 'UPDATE')
    and public.is_time_entry_period_locked(new.organization_id, new.user_id, new.start_time) then
    raise exception 'time_entry_locked' using errcode = 'P0001';
  end if;

  return coalesce(new, old);
end;
$function$;

CREATE OR REPLACE FUNCTION public.check_time_entry_project_org()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
begin
  if not exists (
    select 1 from public.projects
    where id = new.project_id and organization_id = new.organization_id
  ) then
    raise exception 'project does not belong to the entry''s organization';
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_notification (
  p_organization_id uuid,
  p_recipient_id    uuid,
  p_actor_id        uuid,
  p_type            text,
  p_target_type     text,
  p_target_id       uuid,
  p_link            text,
  p_title           text,
  p_body            text,
  p_metadata        jsonb DEFAULT '{}'::jsonb
)
  RETURNS public.notifications
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_notification public.notifications;
begin
  insert into public.notifications (
    organization_id, recipient_id, actor_id, type, target_type, target_id, link, title, body, metadata
  ) values (
    p_organization_id, p_recipient_id, p_actor_id, p_type, p_target_type, p_target_id, p_link, p_title, p_body, coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_notification;

  return v_notification;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_organization_with_owner (
  p_name     text,
  p_timezone text DEFAULT 'UTC'::text
)
  RETURNS public.organizations
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_org public.organizations;
  v_owner_role_id uuid;
begin
  insert into public.organizations (name, created_by, timezone)
  values (trim(p_name), auth.uid(), coalesce(nullif(trim(p_timezone), ''), 'UTC'))
  returning * into v_org;

  insert into public.roles (organization_id, name, is_system)
  values
    (v_org.id, 'Owner', true),
    (v_org.id, 'Admin', true),
    (v_org.id, 'Member', true);

  insert into public.role_permissions (role_id, permission_id)
  select r.id, p.id
  from public.roles r
  cross join public.permissions p
  where r.organization_id = v_org.id
    and (r.name = 'Owner' or (r.name = 'Admin' and p.key <> 'organization.manage_settings'));

  select id into v_owner_role_id from public.roles where organization_id = v_org.id and name = 'Owner';

  insert into public.memberships (organization_id, user_id, role_id)
  values (v_org.id, auth.uid(), v_owner_role_id);

  return v_org;
end;
$function$;

CREATE OR REPLACE FUNCTION public.decline_invitation (
  p_token uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_invitation_by_token (
  p_token uuid
)
  RETURNS TABLE (
    email             text,
    role_name         text,
    status            text,
    expires_at        timestamp with time zone,
    organization_name text
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select i.email, r.name, i.status, i.expires_at, o.name
  from public.invitations i
  join public.organizations o on o.id = i.organization_id
  join public.roles r on r.id = i.role_id
  where i.token = p_token;
$function$;

CREATE OR REPLACE FUNCTION public.get_pending_invitations_for_current_user()
  RETURNS TABLE (
    id                uuid,
    token             uuid,
    expires_at        timestamp with time zone,
    role_name         text,
    organization_name text
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select i.id, i.token, i.expires_at, r.name, o.name
  from public.invitations i
  join public.roles r on r.id = i.role_id
  join public.organizations o on o.id = i.organization_id
  where i.status = 'pending'
    and i.expires_at > now()
    and lower(i.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  order by i.created_at asc;
$function$;

CREATE OR REPLACE FUNCTION public.has_any_membership (
  p_organization_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_permission (
  p_organization_id uuid,
  p_permission_key  text
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1
    from public.memberships m
    join public.role_permissions rp on rp.role_id = m.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and p.key = p_permission_key
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_org_member (
  p_organization_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_org_owner (
  p_organization_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1
    from public.memberships m
    join public.roles r on r.id = m.role_id
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and r.is_system
      and r.name = 'Owner'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_time_entry_period_locked (
  p_organization_id uuid,
  p_user_id         uuid,
  p_start_time      timestamp with time zone
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1
    from public.timesheets t
    join public.organizations o on o.id = p_organization_id
    where t.organization_id = p_organization_id
      and t.user_id = p_user_id
      and t.status in ('submitted', 'approved')
      and (p_start_time at time zone o.timezone)::date between t.period_start and t.period_end
  );
$function$;

CREATE OR REPLACE FUNCTION public.log_audit_event()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_organization_id uuid;
  v_action text;
begin
  if tg_op = 'INSERT' then
    v_action := tg_table_name || '_created';
  elsif tg_op = 'UPDATE' then
    v_action := tg_table_name || '_updated';
  else
    v_action := tg_table_name || '_deleted';
  end if;

  v_organization_id := coalesce(
    (to_jsonb(new) ->> 'organization_id')::uuid,
    (to_jsonb(old) ->> 'organization_id')::uuid
  );

  if v_organization_id is null and tg_table_name = 'organizations' then
    v_organization_id := coalesce(new.id, old.id);
  end if;

  if v_organization_id is null then
    select p.organization_id into v_organization_id
    from public.projects p
    where p.id = coalesce(
      (to_jsonb(new) ->> 'project_id')::uuid,
      (to_jsonb(old) ->> 'project_id')::uuid
    );
  end if;

  insert into public.audit_logs (organization_id, actor_id, action, target_type, target_id, metadata)
  values (
    v_organization_id,
    auth.uid(),
    v_action,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );

  return coalesce(new, old);
end;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_membership_identity_change()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
begin
  if new.organization_id is distinct from old.organization_id
    or new.user_id is distinct from old.user_id then
    raise exception 'membership_identity_change_forbidden' using errcode = 'P0001';
  end if;

  if new.role_id is distinct from old.role_id
    and coalesce(current_setting('app.bypass_role_guard', true), 'off') <> 'on' then
    raise exception 'membership_identity_change_forbidden' using errcode = 'P0001';
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_organization_identity_change()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  if new.id is distinct from old.id or new.created_by is distinct from old.created_by then
    raise exception 'organization_identity_change_forbidden';
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_profile_identity_change()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  if new.id is distinct from old.id or new.email is distinct from old.email then
    raise exception 'profile_identity_change_forbidden';
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.reject_timesheet (
  p_organization_id uuid,
  p_user_id         uuid,
  p_period_start    date,
  p_reason          text
)
  RETURNS public.timesheets
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_timesheet public.timesheets;
begin
  if not public.has_permission(p_organization_id, 'timesheets.approve') then
    raise exception 'insufficient_permissions' using errcode = 'P0001';
  end if;

  if char_length(trim(coalesce(p_reason, ''))) not between 1 and 1000 then
    raise exception 'rejection_reason_required' using errcode = 'P0001';
  end if;

  update public.timesheets
  set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), rejection_reason = trim(p_reason)
  where organization_id = p_organization_id
    and user_id = p_user_id
    and period_start = p_period_start
    and status = 'submitted'
  returning * into v_timesheet;

  if not found then
    raise exception 'not_pending_approval' using errcode = 'P0001';
  end if;

  perform public.create_notification(
    p_organization_id, v_timesheet.user_id, auth.uid(), 'timesheet_rejected',
    'timesheets', v_timesheet.id, '/timesheets',
    'Your timesheet was rejected', v_timesheet.rejection_reason, '{}'::jsonb
  );

  return v_timesheet;
end;
$function$;

CREATE OR REPLACE FUNCTION public.resubmit_timesheet (
  p_organization_id uuid,
  p_period_start    date
)
  RETURNS public.timesheets
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_period_end date := p_period_start + 6;
  v_timezone text;
  v_timesheet public.timesheets;
  v_approver_id uuid;
begin
  if not public.is_org_member(p_organization_id) then
    raise exception 'insufficient_permissions' using errcode = 'P0001';
  end if;

  select timezone into v_timezone from public.organizations where id = p_organization_id;

  if exists (
    select 1 from public.time_entries te
    where te.organization_id = p_organization_id
      and te.user_id = auth.uid()
      and te.end_time is null
      and (te.start_time at time zone coalesce(v_timezone, 'UTC'))::date between p_period_start and v_period_end
  ) then
    raise exception 'timer_running' using errcode = 'P0001';
  end if;

  update public.timesheets
  set status = 'submitted', submitted_at = now(), reviewed_by = null, reviewed_at = null, rejection_reason = null
  where organization_id = p_organization_id
    and user_id = auth.uid()
    and period_start = p_period_start
    and status = 'rejected'
  returning * into v_timesheet;

  if not found then
    raise exception 'not_rejected' using errcode = 'P0001';
  end if;

  for v_approver_id in
    select m.user_id
    from public.memberships m
    join public.role_permissions rp on rp.role_id = m.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.organization_id = p_organization_id
      and p.key = 'timesheets.approve'
      and m.status = 'active'
      and m.user_id <> auth.uid()
  loop
    perform public.create_notification(
      p_organization_id, v_approver_id, auth.uid(), 'timesheet_submitted',
      'timesheets', v_timesheet.id, '/approvals',
      'A timesheet is ready for review', null, '{}'::jsonb
    );
  end loop;

  return v_timesheet;
end;
$function$;

CREATE OR REPLACE FUNCTION public.run_timesheet_reminders()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_org record;
  v_row record;
begin
  for v_org in select id, timezone from public.organizations loop
    for v_row in
      select distinct t.user_id, t.id as timesheet_id
      from public.timesheets t
      where t.organization_id = v_org.id
        and t.status = 'draft'
        and t.period_end between
          (now() at time zone coalesce(v_org.timezone, 'UTC'))::date - 1
          and (now() at time zone coalesce(v_org.timezone, 'UTC'))::date
    loop
      if not exists (
        select 1 from public.notifications
        where recipient_id = v_row.user_id
          and type = 'timesheet_reminder_employee'
          and target_id = v_row.timesheet_id
          and read_at is null
      ) then
        perform public.create_notification(
          v_org.id, v_row.user_id, null, 'timesheet_reminder_employee',
          'timesheets', v_row.timesheet_id, '/timesheets',
          'Submit your timesheet', 'Your timesheet for a recent period is still a draft.', '{}'::jsonb
        );
      end if;
    end loop;

    for v_row in
      select distinct t.id as timesheet_id, m.user_id as approver_id
      from public.timesheets t
      join public.memberships m on m.organization_id = t.organization_id
      join public.role_permissions rp on rp.role_id = m.role_id
      join public.permissions p on p.id = rp.permission_id
      where t.organization_id = v_org.id
        and t.status = 'submitted'
        and p.key = 'timesheets.approve'
        and m.status = 'active'
        and t.submitted_at <= now() - interval '3 days'
    loop
      if not exists (
        select 1 from public.notifications
        where recipient_id = v_row.approver_id
          and type = 'timesheet_reminder_approver'
          and target_id = v_row.timesheet_id
          and read_at is null
      ) then
        perform public.create_notification(
          v_org.id, v_row.approver_id, null, 'timesheet_reminder_approver',
          'timesheets', v_row.timesheet_id, '/approvals',
          'A timesheet is awaiting review', 'A submitted timesheet has been waiting for review for a few days.', '{}'::jsonb
        );
      end if;
    end loop;
  end loop;
end;
$function$;

CREATE OR REPLACE FUNCTION public.shares_org_with (
  p_user_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1
    from public.memberships mine
    join public.memberships theirs on theirs.organization_id = mine.organization_id
    where mine.user_id = auth.uid()
      and mine.status = 'active'
      and theirs.user_id = p_user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.start_time_entry (
  p_organization_id uuid,
  p_project_id      uuid,
  p_description     text
)
  RETURNS public.time_entries
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
declare
  v_entry public.time_entries;
begin
  update public.time_entries
    set end_time = now()
    where user_id = auth.uid()
      and organization_id = p_organization_id
      and end_time is null;

  insert into public.time_entries (organization_id, user_id, project_id, description, start_time)
  values (p_organization_id, auth.uid(), p_project_id, p_description, now())
  returning * into v_entry;

  return v_entry;
end;
$function$;

CREATE OR REPLACE FUNCTION public.submit_timesheet (
  p_organization_id uuid,
  p_period_start    date
)
  RETURNS public.timesheets
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_period_end date := p_period_start + 6;
  v_timezone text;
  v_timesheet public.timesheets;
  v_approver_id uuid;
begin
  if not public.is_org_member(p_organization_id) then
    raise exception 'insufficient_permissions' using errcode = 'P0001';
  end if;

  select timezone into v_timezone from public.organizations where id = p_organization_id;

  if exists (
    select 1 from public.time_entries te
    where te.organization_id = p_organization_id
      and te.user_id = auth.uid()
      and te.end_time is null
      and (te.start_time at time zone coalesce(v_timezone, 'UTC'))::date between p_period_start and v_period_end
  ) then
    raise exception 'timer_running' using errcode = 'P0001';
  end if;

  insert into public.timesheets (organization_id, user_id, period_start, period_end, status, submitted_at)
  values (p_organization_id, auth.uid(), p_period_start, v_period_end, 'submitted', now())
  on conflict (organization_id, user_id, period_start)
  do update set
    status = 'submitted',
    submitted_at = now(),
    reviewed_by = null,
    reviewed_at = null,
    rejection_reason = null
  where public.timesheets.status = 'draft'
  returning * into v_timesheet;

  if not found then
    raise exception 'not_draft' using errcode = 'P0001';
  end if;

  for v_approver_id in
    select m.user_id
    from public.memberships m
    join public.role_permissions rp on rp.role_id = m.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.organization_id = p_organization_id
      and p.key = 'timesheets.approve'
      and m.status = 'active'
      and m.user_id <> auth.uid()
  loop
    perform public.create_notification(
      p_organization_id, v_approver_id, auth.uid(), 'timesheet_submitted',
      'timesheets', v_timesheet.id, '/approvals',
      'A timesheet is ready for review', null, '{}'::jsonb
    );
  end loop;

  return v_timesheet;
end;
$function$;

CREATE OR REPLACE FUNCTION public.validate_organization_timezone()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
begin
  perform now() at time zone new.timezone;
  return new;
exception
  when invalid_parameter_value then
    raise exception 'invalid_timezone' using errcode = 'P0001';
end;
$function$;

CREATE OR REPLACE FUNCTION public.withdraw_timesheet (
  p_organization_id uuid,
  p_period_start    date
)
  RETURNS public.timesheets
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
declare
  v_timesheet public.timesheets;
begin
  update public.timesheets
  set status = 'draft', submitted_at = null
  where organization_id = p_organization_id
    and user_id = auth.uid()
    and period_start = p_period_start
    and status = 'submitted'
  returning * into v_timesheet;

  if not found then
    raise exception 'timesheet_not_submitted' using errcode = 'P0001';
  end if;

  return v_timesheet;
end;
$function$;

CREATE POLICY "Members with timesheets.approve can view all timesheets" ON "public"."timesheets"
  FOR SELECT
  TO PUBLIC
  USING (public.has_permission(organization_id, 'timesheets.approve'::text));

REVOKE ALL ON FUNCTION "public"."create_notification"(uuid, uuid, uuid, text, text, uuid, text, text, text, jsonb) FROM PUBLIC;

REVOKE ALL ON FUNCTION "public"."run_timesheet_reminders"() FROM PUBLIC;

