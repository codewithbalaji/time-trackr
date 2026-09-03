-- Fixes 20260901113332_phase10_notifications.sql: "revoke execute ... from
-- public" does not strip privileges granted directly to a named role. This
-- project's "alter default privileges ... grant execute on functions to
-- authenticated" (20260826093405_remote_schema.sql) grants EXECUTE to the
-- authenticated (and anon) role directly at function-creation time, so the
-- previous migration's revoke silently did nothing and left
-- create_notification/run_timesheet_reminders callable directly via
-- /rest/v1/rpc/... — confirmed via get_advisors after applying. Revoke from
-- the actual grantee roles instead.

revoke execute on function public.create_notification(uuid, uuid, uuid, text, text, uuid, text, text, text, jsonb) from authenticated, anon;
revoke execute on function public.run_timesheet_reminders() from authenticated, anon;
