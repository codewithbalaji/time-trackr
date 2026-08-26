set local check_function_bodies = off;

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "anon";

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "authenticated";

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "service_role";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "anon";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "authenticated";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "service_role";

revoke all on function "public"."handle_new_user"() from "anon";

grant execute on function "public"."handle_new_user"() to "anon";

revoke all on function "public"."handle_new_user"() from "authenticated";

grant execute on function "public"."handle_new_user"() to "authenticated";

revoke all on function "public"."handle_new_user"() from "service_role";

grant execute on function "public"."handle_new_user"() to "service_role";

revoke all on function "public"."set_updated_at"() from "anon";

grant execute on function "public"."set_updated_at"() to "anon";

revoke all on function "public"."set_updated_at"() from "authenticated";

grant execute on function "public"."set_updated_at"() to "authenticated";

revoke all on function "public"."set_updated_at"() from "service_role";

grant execute on function "public"."set_updated_at"() to "service_role";

revoke all on table "public"."profiles" from "anon";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."profiles" to "anon";

revoke all on table "public"."profiles" from "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."profiles" to "authenticated";

revoke all on table "public"."profiles" from "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."profiles" to "service_role";

alter default privileges for role "postgres" in schema "public" grant select, update, usage on sequences to "anon";

alter default privileges for role "postgres" in schema "public" grant select, update, usage on sequences to "authenticated";

alter default privileges for role "postgres" in schema "public" grant select, update, usage on sequences to "service_role";

alter default privileges for role "postgres" in schema "public" grant execute on FUNCTIONS to "anon";

alter default privileges for role "postgres" in schema "public" grant execute on FUNCTIONS to "authenticated";

alter default privileges for role "postgres" in schema "public" grant execute on FUNCTIONS to "service_role";

alter default privileges for role "postgres" in schema "public" grant delete, insert, maintain, references, select, trigger, truncate, update on tables to "anon";

alter default privileges for role "postgres" in schema "public" grant delete, insert, maintain, references, select, trigger, truncate, update on tables to "authenticated";

alter default privileges for role "postgres" in schema "public" grant delete, insert, maintain, references, select, trigger, truncate, update on tables to "service_role";

