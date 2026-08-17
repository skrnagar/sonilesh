-- Pin search_path on invoker helpers (lint 0011) and lock EXECUTE on
-- SECURITY DEFINER RPCs (lints 0028/0029). RLS helpers stay callable by
-- authenticated so policies can invoke them as the current user.

-- ---------------------------------------------------------------------------
-- A. search_path (lint 0011)
-- Bodies unchanged; ALTER only sets a fixed search_path.
-- ---------------------------------------------------------------------------

alter function public.set_updated_at() set search_path = public;
alter function public.current_user_id() set search_path = public;
alter function public.prevent_audit_mutation() set search_path = public;
alter function public.capa_is_overdue(text, date) set search_path = public;
alter function public.assert_same_org_site() set search_path = public;
alter function public.assert_same_org_bu() set search_path = public;
alter function public.assert_custom_field_same_org() set search_path = public;
alter function public.assert_risk_assessment_same_org() set search_path = public;
alter function public.assert_permit_same_org() set search_path = public;
alter function public.assert_checklist_assignment_same_org() set search_path = public;

-- ---------------------------------------------------------------------------
-- next_event_number: keep live numbering (year + pad), add membership check.
-- service_role / postgres skip the membership check (no auth.uid()).
-- ---------------------------------------------------------------------------

create or replace function public.next_event_number(
  p_organization_id uuid,
  p_sequence_key text,
  p_prefix text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value bigint;
  v_pad integer;
  v_include_year boolean;
  v_year text;
  v_prefix text;
begin
  if p_organization_id is null then
    raise exception 'organization required';
  end if;

  if auth.uid() is not null then
    if not (public.is_platform_admin() or public.is_org_member(p_organization_id)) then
      raise exception 'not authorized to allocate event numbers';
    end if;
  elsif current_setting('role') not in ('service_role', 'supabase_admin', 'postgres') then
    raise exception 'not authorized to allocate event numbers';
  end if;

  insert into public.number_sequences (organization_id, sequence_key, prefix, current_value, pad_length, include_year)
  values (p_organization_id, p_sequence_key, p_prefix, 0, 5, true)
  on conflict (organization_id, sequence_key) do nothing;

  update public.number_sequences
  set current_value = current_value + 1,
      updated_at = timezone('utc', now()),
      prefix = coalesce(nullif(prefix, ''), p_prefix)
  where organization_id = p_organization_id
    and sequence_key = p_sequence_key
  returning current_value, pad_length, include_year, prefix
  into v_value, v_pad, v_include_year, v_prefix;

  v_year := to_char(timezone('utc', now()), 'YYYY');
  if coalesce(v_include_year, true) then
    return v_prefix || v_year || '-' || lpad(v_value::text, coalesce(v_pad, 5), '0');
  end if;
  return v_prefix || lpad(v_value::text, coalesce(v_pad, 5), '0');
end;
$$;

-- Onboarding seed RPC: same membership gate as numbering (write definer).
create or replace function public.seed_org_report_categories(p_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_organization_id is null then
    raise exception 'organization required';
  end if;

  if auth.uid() is not null then
    if not (public.is_platform_admin() or public.is_org_member(p_organization_id)) then
      raise exception 'not authorized to seed report categories';
    end if;
  elsif current_setting('role') not in ('service_role', 'supabase_admin', 'postgres') then
    raise exception 'not authorized to seed report categories';
  end if;

  insert into public.event_categories (organization_id, event_type_id, code, name, is_active)
  select p_organization_id, et.id, t.code, t.name, true
  from public.report_category_templates t
  join public.event_types et on et.code = t.event_type_code and et.organization_id is null
  on conflict (organization_id, event_type_id, code) do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- B/C. EXECUTE grants (lint 0028 + 0029)
-- Revoke PUBLIC default + anon everywhere. Grant authenticated only where
-- the app or RLS needs it. Trigger/cron/internal stay off PostgREST.
-- ---------------------------------------------------------------------------

-- bootstrap_organization: onboarding RPC (auth.uid() required inside)
revoke all on function public.bootstrap_organization(text, text, text, text, text) from public;
revoke execute on function public.bootstrap_organization(text, text, text, text, text) from anon;
grant execute on function public.bootstrap_organization(text, text, text, text, text) to authenticated;
grant execute on function public.bootstrap_organization(text, text, text, text, text) to service_role;

-- expire_overdue_permits: service_role / cron only (global update)
revoke all on function public.expire_overdue_permits() from public;
revoke execute on function public.expire_overdue_permits() from anon, authenticated;
grant execute on function public.expire_overdue_permits() to service_role;

-- handle_new_user: auth.users trigger only
revoke all on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;
grant execute on function public.handle_new_user() to postgres;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant execute on function public.handle_new_user() to supabase_auth_admin;
  end if;
end $$;

-- rls_auto_enable: event trigger / postgres / service_role only
revoke all on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon, authenticated;
grant execute on function public.rls_auto_enable() to postgres;
grant execute on function public.rls_auto_enable() to service_role;

-- seed_org_report_categories: logged-in onboarding
revoke all on function public.seed_org_report_categories(uuid) from public;
revoke execute on function public.seed_org_report_categories(uuid) from anon;
grant execute on function public.seed_org_report_categories(uuid) to authenticated;
grant execute on function public.seed_org_report_categories(uuid) to service_role;

-- next_event_number: app RPC (membership checked inside)
revoke all on function public.next_event_number(uuid, text, text) from public;
revoke execute on function public.next_event_number(uuid, text, text) from anon;
grant execute on function public.next_event_number(uuid, text, text) to authenticated;
grant execute on function public.next_event_number(uuid, text, text) to service_role;

-- resolve_risk_band / has_blocking_capa: app RPCs
revoke all on function public.resolve_risk_band(uuid, integer) from public;
revoke execute on function public.resolve_risk_band(uuid, integer) from anon;
grant execute on function public.resolve_risk_band(uuid, integer) to authenticated;
grant execute on function public.resolve_risk_band(uuid, integer) to service_role;

revoke all on function public.has_blocking_capa(uuid, text, uuid) from public;
revoke execute on function public.has_blocking_capa(uuid, text, uuid) from anon;
grant execute on function public.has_blocking_capa(uuid, text, uuid) to authenticated;
grant execute on function public.has_blocking_capa(uuid, text, uuid) to service_role;

-- RLS helpers: MUST remain executable by authenticated (policies call them
-- as the current user). Revoke anon + PUBLIC only. Lint 0029 is expected.
revoke all on function public.is_org_member(uuid) from public;
revoke execute on function public.is_org_member(uuid) from anon;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_member(uuid) to service_role;

revoke all on function public.has_org_permission(uuid, text, uuid) from public;
revoke execute on function public.has_org_permission(uuid, text, uuid) from anon;
grant execute on function public.has_org_permission(uuid, text, uuid) to authenticated;
grant execute on function public.has_org_permission(uuid, text, uuid) to service_role;

revoke all on function public.is_platform_admin() from public;
revoke execute on function public.is_platform_admin() from anon;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_platform_admin() to service_role;
