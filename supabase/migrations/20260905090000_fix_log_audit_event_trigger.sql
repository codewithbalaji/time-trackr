-- Fixes a bug in 20260904090000's log_audit_event(): it accessed
-- new.organization_id/old.organization_id unconditionally, but project_members
-- has no organization_id column, so PL/pgSQL raised "record has no field
-- organization_id" on every insert/update/delete of project_members. Extract
-- through jsonb instead, which safely returns null for a missing key.
create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;
