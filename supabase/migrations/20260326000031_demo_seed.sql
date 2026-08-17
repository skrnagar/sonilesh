-- =============================================================================
-- DEMO / TEST SEED (internal click-through data — NOT customers)
-- =============================================================================
-- Purpose: Repeatable tenant rows so EHS360 modules can be exercised in demos.
-- These organizations are invented DEMO tenants. They are not paying customers,
-- not marketing social proof, and must never be shown as SOC 2 / ISO / MRR.
--
-- Auth users cannot be created from SQL (auth.users). Create them first:
--   node scripts/seed-demo.mjs
-- which calls public.seed_demo_content() after upserting Auth users.
--
-- Idempotent: unique slugs / codes / numbers use ON CONFLICT.
-- Tenant isolation: each org is a real organizations row with its own members.
-- =============================================================================

create or replace function public._demo_profile_id(p_email text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where lower(email) = lower(p_email) and deleted_at is null limit 1;
$$;

create or replace function public._demo_role_id(p_code text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.roles where organization_id is null and code = p_code limit 1;
$$;

create or replace function public._demo_ensure_member(
  p_org uuid,
  p_user uuid,
  p_title text,
  p_owner boolean,
  p_role_codes text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member uuid;
  v_code text;
  v_role uuid;
begin
  if p_user is null then
    raise exception 'demo member user is null for title %', p_title;
  end if;

  insert into public.organization_members (
    organization_id, user_id, status, title, is_owner, joined_at, created_by
  ) values (
    p_org, p_user, 'active', p_title, p_owner, timezone('utc', now()), p_user
  )
  on conflict (organization_id, user_id) do update
    set status = 'active',
        title = excluded.title,
        is_owner = excluded.is_owner,
        deleted_at = null,
        joined_at = coalesce(public.organization_members.joined_at, excluded.joined_at)
  returning id into v_member;

  foreach v_code in array p_role_codes loop
    v_role := public._demo_role_id(v_code);
    if v_role is null then
      continue;
    end if;
    if not exists (
      select 1 from public.member_roles
      where member_id = v_member and role_id = v_role and deleted_at is null
    ) then
      insert into public.member_roles (member_id, role_id, scope)
      values (v_member, v_role, 'organization');
    end if;
  end loop;

  return v_member;
end;
$$;

create or replace function public._demo_ensure_org(
  p_name text,
  p_legal text,
  p_slug text,
  p_industry text,
  p_city text,
  p_state text,
  p_owner uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_plan uuid;
begin
  insert into public.organizations (
    name, legal_name, slug, industry, company_type, status, country, state, city,
    timezone, currency, company_size, website,
    onboarding_completed_at, trial_ends_at, last_activity_at,
    created_by, updated_by
  ) values (
    p_name, p_legal, p_slug, p_industry, 'private_limited', 'trial', 'IN', p_state, p_city,
    'Asia/Kolkata', 'INR', '51-250', 'https://demo.local',
    timezone('utc', now()), timezone('utc', now()) + interval '365 days', timezone('utc', now()),
    p_owner, p_owner
  )
  on conflict (slug) do update
    set name = excluded.name,
        legal_name = excluded.legal_name,
        industry = excluded.industry,
        status = 'trial',
        country = 'IN',
        state = excluded.state,
        city = excluded.city,
        timezone = 'Asia/Kolkata',
        currency = 'INR',
        onboarding_completed_at = coalesce(public.organizations.onboarding_completed_at, excluded.onboarding_completed_at),
        trial_ends_at = excluded.trial_ends_at,
        deleted_at = null,
        updated_by = excluded.updated_by
  returning id into v_org;

  insert into public.organization_settings (
    organization_id, locale, date_format, default_currency, settings
  ) values (
    v_org, 'en', 'dd-MM-yyyy', 'INR', '{"demo": true, "source": "seed_demo"}'::jsonb
  )
  on conflict (organization_id) do update
    set default_currency = 'INR',
        settings = coalesce(public.organization_settings.settings, '{}'::jsonb) || '{"demo": true, "source": "seed_demo"}'::jsonb;

  insert into public.billing_accounts (organization_id, company_name, currency)
  values (v_org, p_name, 'INR')
  on conflict (organization_id) do update
    set company_name = excluded.company_name, currency = 'INR';

  select id into v_plan from public.plans where code = 'enterprise' limit 1;
  if v_plan is not null and not exists (
    select 1 from public.subscriptions
    where organization_id = v_org
      and deleted_at is null
      and status in ('trialing', 'active', 'past_due', 'paused')
  ) then
    insert into public.subscriptions (
      organization_id, plan_id, status, billing_interval,
      trial_ends_at, current_period_start, current_period_end, created_by, metadata
    ) values (
      v_org, v_plan, 'trialing', 'monthly',
      timezone('utc', now()) + interval '365 days',
      timezone('utc', now()),
      timezone('utc', now()) + interval '365 days',
      p_owner,
      '{"source": "demo_seed", "demo": true}'::jsonb
    );
  end if;

  insert into public.organization_onboarding_progress (
    organization_id, current_step, completed_steps, skipped_steps, updated_by
  ) values (
    v_org, 'finish',
    array['welcome','company','industry','structure','business_unit','site','project','invite','ehs_config','review','finish'],
    '{}',
    p_owner
  )
  on conflict (organization_id) do update
    set current_step = 'finish',
        completed_steps = excluded.completed_steps,
        updated_by = excluded.updated_by;

  if not exists (
    select 1 from public.risk_matrices where organization_id = v_org
  ) then
    insert into public.risk_matrices (organization_id, name, is_default)
    values (v_org, 'Default 5x5', true);
  end if;

  if to_regprocedure('public.seed_org_report_categories(uuid)') is not null then
    perform public.seed_org_report_categories(v_org);
  end if;

  insert into public.number_sequences (organization_id, sequence_key, prefix, current_value) values
    (v_org, 'incident', 'INC-', 10),
    (v_org, 'near_miss', 'NM-', 10),
    (v_org, 'hazard', 'HZ-', 10),
    (v_org, 'unsafe_act', 'UA-', 10),
    (v_org, 'unsafe_condition', 'UC-', 10),
    (v_org, 'safety_observation', 'SO-', 10),
    (v_org, 'risk_assessment', 'RA-', 10),
    (v_org, 'jsa', 'JSA-', 10),
    (v_org, 'jha', 'JHA-', 10),
    (v_org, 'inspection', 'INS-', 10),
    (v_org, 'audit', 'AUD-', 10),
    (v_org, 'toolbox', 'TBT-', 10),
    (v_org, 'moc', 'MOC-', 10),
    (v_org, 'permit:hot_work', 'HOT_WORK-', 10),
    (v_org, 'permit:confined_space', 'CONFINED_SPACE-', 10)
  on conflict (organization_id, sequence_key) do update
    set current_value = greatest(public.number_sequences.current_value, excluded.current_value);

  return v_org;
end;
$$;

-- Main entry: requires Auth profiles from scripts/seed-demo.mjs
create or replace function public.seed_demo_content()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_missing text[] := '{}';
  v_email text;
  -- SONIL POWER
  u_harish uuid;
  u_abhishek uuid;
  u_sunil uuid;
  u_vikram uuid;
  -- Kavach Solar
  u_priya uuid;
  u_anjali uuid;
  -- Narmada ChemLog
  u_rohit uuid;
  u_meera uuid;
  org_power uuid;
  org_solar uuid;
  org_chem uuid;
  -- lookups
  et_inc uuid; et_nm uuid; et_hz uuid; et_ua uuid; et_so uuid;
  sev_high uuid; sev_med uuid; sev_low uuid; sev_crit uuid;
  ra_type uuid; jsa_type uuid;
  pt_hw uuid; pt_cs uuid;
  fc_major uuid;
  -- power org structure
  bu_td uuid; site_pith uuid; site_indore uuid; proj_400 uuid; loc_bay uuid; dept_ehs uuid;
  matrix_id uuid;
  ev_inc uuid; ev_nm uuid; ra_id uuid; hz_id uuid; pmt_id uuid; tpl_id uuid; asg_id uuid;
  q_id uuid; capa_id uuid; course_id uuid; ttype_id uuid; talk_id uuid;
  obl_id uuid; oac_id uuid;
  fy text := '2025-26';
begin
  u_harish := public._demo_profile_id('harish@demo.sonilpower.local');
  u_abhishek := public._demo_profile_id('abhishek@demo.sonilpower.local');
  u_sunil := public._demo_profile_id('sunil@demo.sonilpower.local');
  u_vikram := public._demo_profile_id('vikram@demo.sonilpower.local');
  u_priya := public._demo_profile_id('priya@demo.kavachsolar.local');
  u_anjali := public._demo_profile_id('anjali@demo.kavachsolar.local');
  u_rohit := public._demo_profile_id('rohit@demo.narmadachemlog.local');
  u_meera := public._demo_profile_id('meera@demo.narmadachemlog.local');

  foreach v_email in array array[
    'harish@demo.sonilpower.local',
    'abhishek@demo.sonilpower.local',
    'sunil@demo.sonilpower.local',
    'vikram@demo.sonilpower.local',
    'priya@demo.kavachsolar.local',
    'anjali@demo.kavachsolar.local',
    'rohit@demo.narmadachemlog.local',
    'meera@demo.narmadachemlog.local'
  ] loop
    if public._demo_profile_id(v_email) is null then
      v_missing := array_append(v_missing, v_email);
    end if;
  end loop;

  if array_length(v_missing, 1) is not null then
    return jsonb_build_object(
      'ok', false,
      'reason', 'missing_auth_profiles',
      'missing_users', to_jsonb(v_missing),
      'hint', 'Run: node scripts/seed-demo.mjs'
    );
  end if;

  select id into et_inc from public.event_types where organization_id is null and code = 'incident';
  select id into et_nm from public.event_types where organization_id is null and code = 'near_miss';
  select id into et_hz from public.event_types where organization_id is null and code = 'hazard';
  select id into et_ua from public.event_types where organization_id is null and code = 'unsafe_act';
  select id into et_so from public.event_types where organization_id is null and code = 'safety_observation';
  select id into sev_low from public.severity_levels where organization_id is null and code = 'low';
  select id into sev_med from public.severity_levels where organization_id is null and code = 'medium';
  select id into sev_high from public.severity_levels where organization_id is null and code = 'high';
  select id into sev_crit from public.severity_levels where organization_id is null and code = 'critical';
  select id into ra_type from public.risk_assessment_types where organization_id is null and code = 'risk_assessment';
  select id into jsa_type from public.risk_assessment_types where organization_id is null and code = 'jsa';
  select id into pt_hw from public.permit_types where organization_id is null and code = 'hot_work';
  select id into pt_cs from public.permit_types where organization_id is null and code = 'confined_space';
  select id into fc_major from public.finding_categories where organization_id is null and code = 'major';

  -- -------------------------------------------------------------------------
  -- DEMO org 1: SONIL POWER (power / transmission)
  -- -------------------------------------------------------------------------
  org_power := public._demo_ensure_org(
    'SONIL POWER',
    'SONIL Power Projects Pvt Ltd',
    'demo-sonil-power',
    'Transmission & Distribution',
    'Indore',
    'Madhya Pradesh',
    u_harish
  );

  perform public._demo_ensure_member(org_power, u_harish, 'EHS Manager', true, array['tenant_admin', 'ehs_manager']);
  perform public._demo_ensure_member(org_power, u_abhishek, 'Site Supervisor', false, array['supervisor']);
  perform public._demo_ensure_member(org_power, u_sunil, 'Permit Issuer', false, array['approver', 'ehs_officer']);
  perform public._demo_ensure_member(org_power, u_vikram, 'Field Technician', false, array['employee']);

  insert into public.business_units (organization_id, name, code, description, status, created_by)
  values (org_power, 'Transmission', 'TD', 'DEMO — 400 kV transmission operations', 'active', u_harish)
  on conflict (organization_id, code) do update set name = excluded.name
  returning id into bu_td;

  insert into public.sites (
    organization_id, business_unit_id, name, code, address, city, state, country,
    timezone, site_type, status, created_by
  ) values (
    org_power, bu_td, 'Pithampur Substation', 'PITH-SS',
    'Industrial Area, Sector 3', 'Pithampur', 'Madhya Pradesh', 'IN',
    'Asia/Kolkata', 'permanent', 'active', u_harish
  )
  on conflict (organization_id, code) do update set name = excluded.name, city = excluded.city
  returning id into site_pith;

  insert into public.sites (
    organization_id, business_unit_id, name, code, address, city, state, country,
    timezone, site_type, status, created_by
  ) values (
    org_power, bu_td, 'Indore Grid Complex', 'IND-GC',
    'AB Road', 'Indore', 'Madhya Pradesh', 'IN',
    'Asia/Kolkata', 'permanent', 'active', u_harish
  )
  on conflict (organization_id, code) do update set name = excluded.name, city = excluded.city
  returning id into site_indore;

  insert into public.projects (
    organization_id, site_id, business_unit_id, name, code, status, project_type,
    start_date, created_by
  ) values (
    org_power, site_pith, bu_td, '400 kV Pithampur LILO', 'PITH-400', 'active',
    'transmission_line', '2025-06-01', u_harish
  )
  on conflict (organization_id, code) do update set name = excluded.name
  returning id into proj_400;

  insert into public.departments (organization_id, site_id, business_unit_id, name, code, status, created_by)
  values (org_power, site_pith, bu_td, 'EHS', 'EHS', 'active', u_harish)
  on conflict (organization_id, site_id, code) do update set name = excluded.name
  returning id into dept_ehs;

  insert into public.locations (
    organization_id, site_id, project_id, name, code, location_type, status, created_by
  ) values (
    org_power, site_pith, proj_400, 'Bay 12 — Transformer yard', 'BAY-12', 'substation', 'active', u_harish
  )
  on conflict (organization_id, site_id, code) do update set name = excluded.name
  returning id into loc_bay;

  select id into matrix_id from public.risk_matrices where organization_id = org_power order by is_default desc limit 1;

  -- Events
  insert into public.ehs_events (
    organization_id, event_type_id, event_number, site_id, project_id, location_id,
    department_id, business_unit_id, severity_id, status, title, description,
    occurred_at, reported_at, reporter_id, assigned_to, investigator_id,
    investigation_required, source, created_by, immediate_action
  ) values (
    org_power, et_inc, 'INC-00001', site_pith, proj_400, loc_bay, dept_ehs, bu_td, sev_high,
    'investigation',
    'Slip on cable trench cover — Bay 12',
    'DEMO: Technician slipped on a displaced trench cover during evening shift. First aid on site. No lost time claimed — click-through sample only.',
    timestamptz '2026-06-12 11:40:00+05:30', timestamptz '2026-06-12 12:10:00+05:30',
    u_vikram, u_harish, u_harish, true, 'field', u_vikram,
    'Area barricaded; cover reseated; toolbox reminder next morning.'
  )
  on conflict (organization_id, event_number) do update
    set title = excluded.title, status = excluded.status
  returning id into ev_inc;

  insert into public.ehs_events (
    organization_id, event_type_id, event_number, site_id, project_id, location_id,
    business_unit_id, severity_id, status, title, description,
    occurred_at, reported_at, reporter_id, assigned_to, source, created_by
  ) values (
    org_power, et_nm, 'NM-00001', site_indore, null, null, bu_td, sev_med,
    'submitted',
    'Dropped spanner from gantry — no injury',
    'DEMO: Spanner slipped from height while tightening a jumper clamp. Exclusion zone was clear.',
    timestamptz '2026-07-03 09:15:00+05:30', timestamptz '2026-07-03 09:40:00+05:30',
    u_abhishek, u_harish, 'web', u_abhishek
  )
  on conflict (organization_id, event_number) do update set title = excluded.title
  returning id into ev_nm;

  insert into public.ehs_events (
    organization_id, event_type_id, event_number, site_id, project_id, severity_id,
    status, title, description, occurred_at, reported_at, reporter_id, source, created_by
  ) values (
    org_power, et_hz, 'HZ-00001', site_pith, proj_400, sev_med,
    'triage',
    'Damaged earth mat riser near fence',
    'DEMO: Corrosion and a loose clamp observed on an earth riser. Reported during walkthrough.',
    timestamptz '2026-07-18 16:00:00+05:30', timestamptz '2026-07-18 16:20:00+05:30',
    u_vikram, 'field', u_vikram
  )
  on conflict (organization_id, event_number) do update set title = excluded.title;

  insert into public.ehs_events (
    organization_id, event_type_id, event_number, site_id, severity_id, status,
    title, description, occurred_at, reported_at, reporter_id, source, created_by,
    observation_polarity
  ) values (
    org_power, et_so, 'SO-00001', site_indore, sev_low, 'closed',
    'Crew used full body harness on gantry',
    'DEMO: Positive observation — supervisor verified double lanyard use before climbing.',
    timestamptz '2026-08-01 08:30:00+05:30', timestamptz '2026-08-01 08:45:00+05:30',
    u_abhishek, 'web', u_abhishek, 'positive'
  )
  on conflict (organization_id, event_number) do update set title = excluded.title;

  insert into public.ehs_events (
    organization_id, event_type_id, event_number, site_id, severity_id, status,
    title, description, occurred_at, reported_at, reporter_id, source, created_by
  ) values (
    org_power, et_ua, 'UA-00001', site_pith, sev_med, 'submitted',
    'Helper entered live-work buffer without briefing',
    'DEMO: Stopped by supervisor. Sample unsafe-act row for observations module.',
    timestamptz '2026-08-05 14:10:00+05:30', timestamptz '2026-08-05 14:25:00+05:30',
    u_sunil, 'web', u_sunil
  )
  on conflict (organization_id, event_number) do update set title = excluded.title;

  insert into public.investigations (
    organization_id, event_id, method, root_cause, narrative, status, started_at, created_by
  )
  select org_power, ev_inc, '5_why',
    'DEMO: Trench cover not locked after previous cable pulling.',
    'Walkthrough found missing locking pin. Sample investigation only.',
    'in_progress', timezone('utc', now()) - interval '3 days', u_harish
  where not exists (select 1 from public.investigations where event_id = ev_inc);

  insert into public.ehs_event_activity (organization_id, event_id, actor_user_id, activity_type, message)
  select org_power, ev_inc, u_harish, 'assigned', 'DEMO: Assigned to Harish for investigation'
  where not exists (
    select 1 from public.ehs_event_activity where event_id = ev_inc and activity_type = 'assigned'
  );

  -- Risk + JSA
  insert into public.risk_assessments (
    organization_id, assessment_type_id, matrix_id, assessment_number, title, task_activity,
    site_id, project_id, location_id, status, assessment_date, owner_id,
    inherent_risk_score, inherent_risk_band, residual_risk_score, residual_risk_band,
    notes, created_by
  ) values (
    org_power, ra_type, matrix_id, 'RA-00001',
    'Hot work in transformer yard',
    'Welding on cable tray supports',
    site_pith, proj_400, loc_bay, 'active', '2026-07-20', u_harish,
    16, 'critical', 8, 'medium',
    'DEMO risk assessment for PTW linkage — not a live plant document.',
    u_harish
  )
  on conflict (organization_id, assessment_number) do update set title = excluded.title
  returning id into ra_id;

  insert into public.risk_assessment_team (organization_id, assessment_id, user_id, member_name, role_label)
  select org_power, ra_id, u_sunil, 'Sunil Verma', 'Permit Issuer'
  where not exists (
    select 1 from public.risk_assessment_team where assessment_id = ra_id and user_id = u_sunil
  );

  insert into public.risk_hazards (
    organization_id, assessment_id, hazard_description, persons_at_risk, sort_order,
    inherent_likelihood, inherent_consequence, inherent_score, inherent_band,
    residual_likelihood, residual_consequence, residual_score, residual_band,
    owner_id, status
  )
  select org_power, ra_id, 'Fire from welding slag near oil-filled equipment', 'Welders and nearby crew', 1,
    4, 4, 16, 'critical', 2, 4, 8, 'medium', u_harish, 'controlled'
  where not exists (select 1 from public.risk_hazards where assessment_id = ra_id)
  returning id into hz_id;

  if hz_id is not null then
    insert into public.risk_controls (
      organization_id, hazard_id, control_type, hierarchy, description, owner_id, is_implemented
    ) values (
      org_power, hz_id, 'existing', 'administrative',
      'DEMO: Fire watch + charged extinguisher + oil bund inspection before welding.',
      u_sunil, true
    );
  end if;

  insert into public.risk_assessments (
    organization_id, assessment_type_id, matrix_id, assessment_number, title, task_activity,
    site_id, status, owner_id, notes, created_by
  ) values (
    org_power, jsa_type, matrix_id, 'JSA-00001',
    'JSA — jumper clamp tightening on gantry',
    'Tighten jumper clamps at height',
    site_indore, 'active', u_abhishek,
    'DEMO JSA stub.',
    u_abhishek
  )
  on conflict (organization_id, assessment_number) do nothing;

  -- Permit
  insert into public.permits (
    organization_id, permit_type_id, permit_number, status, title, work_description, description,
    site_id, project_id, location_id, requester_id, issuer_id, permit_issuer_id,
    risk_assessment_id, valid_from, valid_to, created_by, submitted_at, activated_at, qr_token
  ) values (
    org_power, pt_hw, 'HOT_WORK-00001', 'active',
    'Weld cable tray support — Bay 12',
    'DEMO: Welding on tray supports in transformer yard. Sample active permit.',
    'DEMO: Welding on tray supports in transformer yard. Sample active permit.',
    site_pith, proj_400, loc_bay, u_abhishek, u_sunil, u_sunil, ra_id,
    timezone('utc', now()) - interval '2 hours',
    timezone('utc', now()) + interval '6 hours',
    u_abhishek, timezone('utc', now()) - interval '3 hours', timezone('utc', now()) - interval '2 hours',
    'demo-sonil-power-hw-00001'
  )
  on conflict (organization_id, permit_number) do update
    set status = 'active', title = excluded.title
  returning id into pmt_id;

  insert into public.permit_checklist_items (organization_id, permit_id, item_text, is_required, is_checked, checked_by, checked_at, sort_order)
  select org_power, pmt_id, 'Fire extinguisher at point of work', true, true, u_sunil, timezone('utc', now()), 1
  where not exists (select 1 from public.permit_checklist_items where permit_id = pmt_id);

  insert into public.permit_approvals (organization_id, permit_id, approver_role, approver_id, status, signature_name, signed_at)
  select org_power, pmt_id, 'permit_issuer', u_sunil, 'approved', 'Sunil Verma', timezone('utc', now()) - interval '2 hours'
  where not exists (select 1 from public.permit_approvals where permit_id = pmt_id);

  insert into public.permit_workers (organization_id, permit_id, user_id, worker_name, role_label)
  select org_power, pmt_id, u_vikram, 'Vikram Singh', 'welder'
  where not exists (select 1 from public.permit_workers where permit_id = pmt_id and user_id = u_vikram);

  insert into public.permits (
    organization_id, permit_type_id, permit_number, status, title, work_description, description,
    site_id, requester_id, created_by
  ) values (
    org_power, pt_cs, 'CONFINED_SPACE-00001', 'requested',
    'Cable cellar inspection',
    'DEMO: Requested confined-space entry for cellar inspection.',
    'DEMO: Requested confined-space entry for cellar inspection.',
    site_indore, u_abhishek, u_abhishek
  )
  on conflict (organization_id, permit_number) do nothing;

  -- Checklist / inspection / audit
  insert into public.checklist_templates (
    organization_id, code, name, description, checklist_type, scoring_enabled, created_by
  ) values (
    org_power, 'SS-WALK', 'Substation weekly walkthrough', 'DEMO inspection template', 'inspection', true, u_harish
  )
  on conflict (organization_id, code) do update set name = excluded.name
  returning id into tpl_id;

  if not exists (select 1 from public.checklist_sections where template_id = tpl_id) then
    insert into public.checklist_sections (organization_id, template_id, title, sort_order)
    values (org_power, tpl_id, 'Housekeeping & access', 1)
    returning id into q_id;

    insert into public.checklist_questions (organization_id, section_id, prompt, question_type, is_required, sort_order)
    values
      (org_power, q_id, 'Walkways clear of cable drums?', 'pass_fail', true, 1),
      (org_power, q_id, 'Trench covers seated and locked?', 'pass_fail', true, 2);
  end if;

  insert into public.checklist_assignments (
    organization_id, template_id, assignment_number, checklist_type, title, status,
    site_id, project_id, assignee_id, scheduled_for, due_date, created_by
  ) values (
    org_power, tpl_id, 'INS-00001', 'inspection', 'Pithampur weekly walkthrough', 'in_progress',
    site_pith, proj_400, u_abhishek, current_date, current_date + 2, u_harish
  )
  on conflict (organization_id, assignment_number) do update set title = excluded.title
  returning id into asg_id;

  insert into public.checklist_findings (
    organization_id, assignment_id, category_id, title, description, status, created_by
  )
  select org_power, asg_id, fc_major,
    'Trench cover locking pin missing — Bay 12',
    'DEMO finding linked to the sample incident.',
    'open', u_abhishek
  where not exists (select 1 from public.checklist_findings where assignment_id = asg_id);

  insert into public.checklist_templates (
    organization_id, code, name, description, checklist_type, created_by
  ) values (
    org_power, 'ISO-INT', 'Internal EHS audit (DEMO)', 'DEMO audit template', 'audit', u_harish
  )
  on conflict (organization_id, code) do nothing;

  insert into public.checklist_assignments (
    organization_id, template_id, assignment_number, checklist_type, title, status,
    site_id, assignee_id, auditee_id, scheduled_for, created_by
  )
  select org_power, t.id, 'AUD-00001', 'audit', 'Q1 internal EHS audit — Pithampur', 'planned',
    site_pith, u_harish, u_abhishek, current_date + 14, u_harish
  from public.checklist_templates t
  where t.organization_id = org_power and t.code = 'ISO-INT'
  on conflict (organization_id, assignment_number) do nothing;

  -- CAPA (from incident)
  insert into public.capa_items (
    organization_id, source_module, source_record_id, event_id, title, description,
    capa_type, status, priority, owner_id, due_date, is_required, created_by
  )
  select org_power, 'incident', ev_inc, ev_inc,
    'Fit locking pins on all Bay 12 trench covers',
    'DEMO corrective action — sample only.',
    'corrective', 'in_progress', 'high', u_abhishek, (current_date + 10), true, u_harish
  where not exists (
    select 1 from public.capa_items
    where organization_id = org_power and title = 'Fit locking pins on all Bay 12 trench covers' and deleted_at is null
  )
  returning id into capa_id;

  if capa_id is not null then
    insert into public.capa_activity (organization_id, capa_id, action, to_status, notes, actor_id)
    values (org_power, capa_id, 'created', 'in_progress', 'DEMO seed', u_harish);
  end if;

  insert into public.action_items (
    organization_id, title, description, priority, status, owner_id, due_date,
    source_module, source_record_id, created_by
  )
  select org_power, 'Refresh height-work briefing at Indore gantry',
    'DEMO action item from near miss.', 'medium', 'open', u_abhishek, current_date + 7,
    'near_miss', ev_nm, u_harish
  where not exists (
    select 1 from public.action_items
    where organization_id = org_power and title = 'Refresh height-work briefing at Indore gantry'
  );

  -- Notifications (recipient-only inbox)
  insert into public.notifications (organization_id, user_id, title, body, link)
  select org_power, u_harish,
    'Incident INC-00001 needs investigation',
    'DEMO: Slip at Pithampur Bay 12 assigned to you.',
    '/app/incidents'
  where not exists (
    select 1 from public.notifications
    where organization_id = org_power and user_id = u_harish and title = 'Incident INC-00001 needs investigation'
  );

  insert into public.notifications (organization_id, user_id, title, body, link)
  select org_power, u_abhishek,
    'Inspection INS-00001 is in progress',
    'DEMO: Complete the Pithampur weekly walkthrough.',
    '/app/inspections'
  where not exists (
    select 1 from public.notifications
    where organization_id = org_power and user_id = u_abhishek and title like 'Inspection INS-00001%'
  );

  -- Training stubs
  insert into public.training_types (organization_id, code, name)
  values (org_power, 'EHS-IND', 'EHS induction')
  on conflict (organization_id, code) do nothing
  returning id into ttype_id;
  if ttype_id is null then
    select id into ttype_id from public.training_types where organization_id = org_power and code = 'EHS-IND';
  end if;

  insert into public.training_courses (organization_id, training_type_id, code, title, description, validity_days)
  values (org_power, ttype_id, 'HT-WORK', 'Work at height — DEMO module', 'DEMO course stub, not a certified syllabus.', 365)
  on conflict (organization_id, code) do update set title = excluded.title
  returning id into course_id;

  insert into public.training_assignments (organization_id, course_id, user_id, status, due_date)
  select org_power, course_id, u_vikram, 'assigned', current_date + 21
  where not exists (
    select 1 from public.training_assignments ta
    where ta.organization_id = org_power
      and ta.course_id = course_id
      and ta.user_id = u_vikram
      and ta.deleted_at is null
  );

  -- Contractor, toolbox, MoC, PPE, chemical, document
  insert into public.contractor_companies (organization_id, name, status, insurance_expires_on)
  select org_power, 'Kshipra Erection Services (DEMO)', 'active', current_date + 180
  where not exists (
    select 1 from public.contractor_companies
    where organization_id = org_power and name = 'Kshipra Erection Services (DEMO)'
  );

  insert into public.toolbox_talks (organization_id, talk_number, topic, site_id, project_id, presenter_id, notes)
  values (
    org_power, 'TBT-00001', 'Trench covers and cable cellar access',
    site_pith, proj_400, u_abhishek, 'DEMO toolbox talk attendance stub.'
  )
  on conflict (organization_id, talk_number) do nothing
  returning id into talk_id;

  if talk_id is not null then
    insert into public.toolbox_attendance (organization_id, talk_id, user_id, attendee_name)
    values (org_power, talk_id, u_vikram, 'Vikram Singh');
  end if;

  insert into public.moc_requests (
    organization_id, moc_number, title, description, status, site_id, requester_id
  ) values (
    org_power, 'MOC-00001', 'Relocate welding bay 3 m from oil bund',
    'DEMO management-of-change stub.', 'risk_review', site_pith, u_harish
  )
  on conflict (organization_id, moc_number) do nothing;

  insert into public.ppe_categories (organization_id, code, name)
  values (org_power, 'HELMET', 'Safety helmet')
  on conflict (organization_id, code) do nothing;

  insert into public.ppe_items (organization_id, category_id, name, sku, inventory_qty)
  select org_power, c.id, 'Helmet — yellow (DEMO)', 'HLM-Y-01', 24
  from public.ppe_categories c
  where c.organization_id = org_power and c.code = 'HELMET'
    and not exists (select 1 from public.ppe_items where organization_id = org_power and sku = 'HLM-Y-01');

  insert into public.chemicals (organization_id, name, hazard_classification, usage_notes, location_id)
  select org_power, 'Transformer oil — DEMO drum', 'Flammable / environmental',
    'DEMO chemical register row. Not a live SDS.', loc_bay
  where not exists (
    select 1 from public.chemicals where organization_id = org_power and name = 'Transformer oil — DEMO drum'
  );

  insert into public.controlled_documents (organization_id, doc_number, title, status, current_version)
  values (org_power, 'SOP-EHS-004', 'Permit to work — hot work (DEMO copy)', 'approved', '1.0')
  on conflict (organization_id, doc_number) do nothing;

  -- Compliance + ESG (synthetic DEMO values; not operational filings)
  insert into public.org_compliance_profile (
    organization_id, industry_sector, sub_sectors, is_listed, employee_count_band,
    states_of_operation, waste_streams_generated, updated_by
  ) values (
    org_power, 'power_td', array['transmission'], false, '51_250',
    array['Madhya Pradesh'], array['hazardous'], u_harish
  )
  on conflict (organization_id) do update
    set industry_sector = excluded.industry_sector, updated_by = excluded.updated_by;

  select id into obl_id from public.compliance_obligations where code = 'FACTORIES_ANNUAL' limit 1;
  if obl_id is not null then
    insert into public.org_applicable_compliances (
      organization_id, obligation_id, applicability_status, owner_id, status, justification_note
    ) values (
      org_power, obl_id, 'manually_added', u_harish, 'in_progress',
      'DEMO applicability — not a legal determination.'
    )
    on conflict (organization_id, obligation_id) do nothing
    returning id into oac_id;

    if oac_id is null then
      select id into oac_id from public.org_applicable_compliances
      where organization_id = org_power and obligation_id = obl_id;
    end if;

    insert into public.compliance_task_instances (
      organization_id, org_applicable_compliance_id, period_label, due_date, status, notes
    ) values (
      org_power, oac_id, 'FY 2025-26', '2026-01-31', 'open', 'DEMO compliance task'
    )
    on conflict (org_applicable_compliance_id, period_label) do nothing;
  end if;

  insert into public.esg_committee (organization_id, member_user_id, role)
  values (org_power, u_harish, 'Chair (DEMO)')
  on conflict (organization_id, member_user_id) do nothing;

  insert into public.esg_metrics (organization_id, period, metric_key, value, unit, notes, source, updated_by)
  values
    (org_power, fy, 'energy_consumption', 1280, 'GJ', 'DEMO seed — synthetic click-through value, not operational data.', 'demo_seed', u_harish),
    (org_power, fy, 'water_consumption', 420, 'KL', 'DEMO seed — synthetic click-through value, not operational data.', 'demo_seed', u_harish)
  on conflict (organization_id, period, metric_key) do nothing;

  insert into public.ghg_emissions (
    organization_id, site_id, period_start, period_end, scope, category, value_tco2e, source_data_ref, created_by
  )
  select org_power, site_pith, '2025-04-01', '2026-03-31', '2', 'purchased_electricity', 86.4,
    'DEMO seed — synthetic inventory row', u_harish
  where not exists (
    select 1 from public.ghg_emissions
    where organization_id = org_power and scope = '2' and period_start = '2025-04-01'
  );

  insert into public.materiality_assessment (
    organization_id, year, topic, stakeholder_score, business_impact_score, notes
  )
  select org_power, 2026, 'Occupational health and safety', 5, 5, 'DEMO materiality stub'
  where not exists (
    select 1 from public.materiality_assessment
    where organization_id = org_power and year = 2026 and topic = 'Occupational health and safety'
  );

  insert into public.brsr_reports (organization_id, financial_year, status, section_a, created_by)
  values (
    org_power, fy, 'draft',
    '{"note": "DEMO draft — not filed, not a listed-company disclosure."}'::jsonb,
    u_harish
  )
  on conflict (organization_id, financial_year) do nothing;

  -- -------------------------------------------------------------------------
  -- DEMO org 2: Kavach Solar EPC (solar) — isolation tenant
  -- -------------------------------------------------------------------------
  org_solar := public._demo_ensure_org(
    'Kavach Solar EPC (DEMO)',
    'Kavach Solar EPC Private Limited',
    'demo-kavach-solar',
    'Solar',
    'Dewas',
    'Madhya Pradesh',
    u_priya
  );
  perform public._demo_ensure_member(org_solar, u_priya, 'EHS Manager', true, array['tenant_admin', 'ehs_manager']);
  perform public._demo_ensure_member(org_solar, u_anjali, 'Site Supervisor', false, array['supervisor']);

  insert into public.sites (
    organization_id, name, code, city, state, country, timezone, site_type, status, created_by
  ) values (
    org_solar, 'Dewas 40 MW block', 'DEWAS-40', 'Dewas', 'Madhya Pradesh', 'IN',
    'Asia/Kolkata', 'temporary_project', 'active', u_priya
  )
  on conflict (organization_id, code) do update set name = excluded.name
  returning id into site_pith;

  insert into public.projects (organization_id, site_id, name, code, status, project_type, created_by)
  values (org_solar, site_pith, 'Dewas block B tracker install', 'DWS-B', 'active', 'solar', u_priya)
  on conflict (organization_id, code) do nothing;

  insert into public.ehs_events (
    organization_id, event_type_id, event_number, site_id, severity_id, status,
    title, description, occurred_at, reported_at, reporter_id, source, created_by
  ) values (
    org_solar, et_nm, 'NM-00001', site_pith, sev_med, 'submitted',
    'Module crate nearly tipped on unloading',
    'DEMO Kavach-only near miss. Must not appear in SONIL POWER.',
    timestamptz '2026-08-02 10:00:00+05:30', timestamptz '2026-08-02 10:20:00+05:30',
    u_anjali, 'field', u_anjali
  )
  on conflict (organization_id, event_number) do update set title = excluded.title;

  insert into public.permits (
    organization_id, permit_type_id, permit_number, status, title, work_description, description,
    site_id, requester_id, created_by
  ) values (
    org_solar, pt_hw, 'HOT_WORK-00001', 'requested',
    'Tracker pile welding — block B',
    'DEMO Kavach permit. Isolated from SONIL POWER.',
    'DEMO Kavach permit. Isolated from SONIL POWER.',
    site_pith, u_anjali, u_anjali
  )
  on conflict (organization_id, permit_number) do nothing;

  insert into public.notifications (organization_id, user_id, title, body, link)
  select org_solar, u_priya, 'Near miss NM-00001 submitted',
    'DEMO: Module crate near miss at Dewas.', '/app/near-misses'
  where not exists (
    select 1 from public.notifications
    where organization_id = org_solar and user_id = u_priya and title = 'Near miss NM-00001 submitted'
  );

  -- -------------------------------------------------------------------------
  -- DEMO org 3: Narmada ChemLog (chemicals / logistics) — isolation tenant
  -- -------------------------------------------------------------------------
  org_chem := public._demo_ensure_org(
    'Narmada ChemLog (DEMO)',
    'Narmada ChemLog Private Limited',
    'demo-narmada-chemlog',
    'Chemicals',
    'Dahej',
    'Gujarat',
    u_rohit
  );
  perform public._demo_ensure_member(org_chem, u_rohit, 'EHS Manager', true, array['tenant_admin', 'ehs_manager']);
  perform public._demo_ensure_member(org_chem, u_meera, 'Field Technician', false, array['employee']);

  insert into public.sites (
    organization_id, name, code, city, state, country, timezone, site_type, status, created_by
  ) values (
    org_chem, 'Dahej tank farm', 'DAHEJ-TF', 'Dahej', 'Gujarat', 'IN',
    'Asia/Kolkata', 'permanent', 'active', u_rohit
  )
  on conflict (organization_id, code) do update set name = excluded.name
  returning id into site_indore;

  insert into public.ehs_events (
    organization_id, event_type_id, event_number, site_id, severity_id, status,
    title, description, occurred_at, reported_at, reporter_id, source, created_by
  ) values (
    org_chem, et_hz, 'HZ-00001', site_indore, sev_high, 'triage',
    'Leaking flange on solvent transfer line',
    'DEMO Narmada-only hazard. Must not appear in SONIL POWER or Kavach.',
    timestamptz '2026-08-08 07:50:00+05:30', timestamptz '2026-08-08 08:05:00+05:30',
    u_meera, 'field', u_meera
  )
  on conflict (organization_id, event_number) do update set title = excluded.title;

  insert into public.chemicals (organization_id, name, hazard_classification, usage_notes)
  select org_chem, 'Iso-propanol — DEMO IBC', 'Flammable liquid', 'DEMO chemical register row.'
  where not exists (
    select 1 from public.chemicals where organization_id = org_chem and name = 'Iso-propanol — DEMO IBC'
  );

  insert into public.notifications (organization_id, user_id, title, body, link)
  select org_chem, u_rohit, 'Hazard HZ-00001 reported',
    'DEMO: Solvent flange leak at Dahej.', '/app/hazards'
  where not exists (
    select 1 from public.notifications
    where organization_id = org_chem and user_id = u_rohit and title = 'Hazard HZ-00001 reported'
  );

  return jsonb_build_object(
    'ok', true,
    'demo', true,
    'note', 'Internal DEMO tenants — not paying customers',
    'organizations', jsonb_build_array(
      jsonb_build_object('name', 'SONIL POWER', 'slug', 'demo-sonil-power', 'id', org_power),
      jsonb_build_object('name', 'Kavach Solar EPC (DEMO)', 'slug', 'demo-kavach-solar', 'id', org_solar),
      jsonb_build_object('name', 'Narmada ChemLog (DEMO)', 'slug', 'demo-narmada-chemlog', 'id', org_chem)
    )
  );
end;
$$;

comment on function public.seed_demo_content() is
  'INTERNAL DEMO/TEST seed. Invented tenants for click-through, not customers. Requires Auth profiles from scripts/seed-demo.mjs.';

revoke all on function public.seed_demo_content() from public, anon, authenticated;
revoke all on function public._demo_profile_id(text) from public, anon, authenticated;
revoke all on function public._demo_role_id(text) from public, anon, authenticated;
revoke all on function public._demo_ensure_member(uuid, uuid, text, boolean, text[]) from public, anon, authenticated;
revoke all on function public._demo_ensure_org(text, text, text, text, text, text, uuid) from public, anon, authenticated;

grant execute on function public.seed_demo_content() to service_role;
grant execute on function public._demo_profile_id(text) to service_role;
grant execute on function public._demo_role_id(text) to service_role;
grant execute on function public._demo_ensure_member(uuid, uuid, text, boolean, text[]) to service_role;
grant execute on function public._demo_ensure_org(text, text, text, text, text, text, uuid) to service_role;
