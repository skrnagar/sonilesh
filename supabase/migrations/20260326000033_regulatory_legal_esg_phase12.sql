-- Phase 12: Regulatory compliance + legal register + ESG/BRSR (configuration-driven).
-- Catalog rows are metadata. Application logic must not encode statute applicability.

-- ---------------------------------------------------------------------------
-- Features & permissions (copy plan grants from existing features — no plan-name list)
-- ---------------------------------------------------------------------------
insert into public.features (code, name, description, category, value_type) values
  ('legal_register', 'Legal Register', 'Org-specific legal register and site-scoped requirements', 'module', 'boolean'),
  ('esg', 'ESG', 'ESG metrics, GHG, materiality, and committee', 'module', 'boolean'),
  ('brsr', 'BRSR reporting', 'BRSR framework overlay on tenant ESG/EHS data', 'module', 'boolean')
on conflict (code) do nothing;

insert into public.plan_features (plan_id, feature_id, enabled, limit_value, unlimited)
select pf.plan_id, nf.id, pf.enabled, pf.limit_value, pf.unlimited
from public.plan_features pf
join public.features ofeat on ofeat.id = pf.feature_id and ofeat.code = 'regulatory_compliance'
join public.features nf on nf.code = 'legal_register'
on conflict (plan_id, feature_id) do update set enabled = excluded.enabled;

insert into public.plan_features (plan_id, feature_id, enabled, limit_value, unlimited)
select pf.plan_id, nf.id, pf.enabled, pf.limit_value, pf.unlimited
from public.plan_features pf
join public.features ofeat on ofeat.id = pf.feature_id and ofeat.code = 'esg_reporting'
join public.features nf on nf.code in ('esg', 'brsr')
on conflict (plan_id, feature_id) do update set enabled = excluded.enabled;

insert into public.permissions (code, module, action, description) values
  ('legal_register.view', 'compliance', 'view', 'View the organization legal register'),
  ('legal_register.manage', 'compliance', 'manage', 'Maintain legal register entries and site assignment'),
  ('compliance.assess', 'compliance', 'assess', 'Run compliance assessments via the checklist engine'),
  ('regulatory_permits.view', 'compliance', 'view', 'View regulatory licenses and consents'),
  ('regulatory_permits.manage', 'compliance', 'manage', 'Maintain regulatory licenses (not EHS PTW)'),
  ('brsr.view', 'esg', 'view', 'View BRSR drafts and framework coverage'),
  ('brsr.manage', 'esg', 'manage', 'Edit BRSR drafts mapped to configured indicators')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and (
    (r.code = 'compliance_officer' and p.code in (
      'legal_register.view','legal_register.manage','compliance.assess',
      'regulatory_permits.view','regulatory_permits.manage'
    ))
    or (r.code = 'company_secretary' and p.code in (
      'legal_register.view','legal_register.manage','compliance.assess',
      'regulatory_permits.view','regulatory_permits.manage','brsr.view'
    ))
    or (r.code = 'esg_officer' and p.code in ('brsr.view','brsr.manage'))
    or (r.code in ('tenant_admin', 'ehs_admin') and p.code in (
      'legal_register.view','legal_register.manage','compliance.assess',
      'regulatory_permits.view','regulatory_permits.manage','brsr.view','brsr.manage'
    ))
    or (r.code = 'super_admin' and p.code in (
      'legal_register.view','legal_register.manage','compliance.assess',
      'regulatory_permits.view','regulatory_permits.manage','brsr.view','brsr.manage'
    ))
  )
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Profile + evidence extensions
-- ---------------------------------------------------------------------------
alter table public.org_compliance_profile
  add column if not exists country_code text,
  add column if not exists jurisdiction_codes text[] not null default '{}',
  add column if not exists site_types text[] not null default '{}',
  add column if not exists auto_noncompliant_on_expired_evidence boolean not null default false;

alter table public.compliance_evidence
  add column if not exists expires_at date,
  add column if not exists legal_register_entry_id uuid,
  add column if not exists requirement_id uuid,
  add column if not exists assessment_id uuid,
  add column if not exists regulatory_permit_id uuid,
  add column if not exists controlled_document_id uuid references public.controlled_documents (id) on delete set null;

alter table public.capa_items drop constraint if exists capa_items_source_module_check;
alter table public.capa_items
  add constraint capa_items_source_module_check
  check (source_module in (
    'incident', 'near_miss', 'hazard', 'unsafe_act', 'unsafe_condition',
    'safety_observation', 'ehs_report', 'risk_assessment', 'inspection',
    'audit', 'permit', 'training', 'contractor', 'other', 'action_item', 'moc', 'compliance'
  ));

-- ---------------------------------------------------------------------------
-- Jurisdictions + regulations (catalog metadata — not statute engines)
-- ---------------------------------------------------------------------------
create table if not exists public.jurisdictions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  country_code text,
  level text not null default 'country'
    check (level in ('country', 'state', 'local', 'supranational', 'other')),
  parent_id uuid references public.jurisdictions (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists jurisdictions_platform_code_uidx
  on public.jurisdictions (code)
  where organization_id is null;

create unique index if not exists jurisdictions_org_code_uidx
  on public.jurisdictions (organization_id, code)
  where organization_id is not null;

create table if not exists public.regulations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  obligation_id uuid references public.compliance_obligations (id) on delete set null,
  code text not null,
  title text not null,
  issuing_authority text,
  citation text,
  summary text,
  source_url text,
  effective_from date,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists regulations_platform_code_uidx
  on public.regulations (code)
  where organization_id is null;

create unique index if not exists regulations_org_code_uidx
  on public.regulations (organization_id, code)
  where organization_id is not null;

-- ---------------------------------------------------------------------------
-- Legal register (org-specific, site-scoped)
-- ---------------------------------------------------------------------------
create table if not exists public.legal_register_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid references public.sites (id) on delete cascade,
  regulation_id uuid references public.regulations (id) on delete set null,
  obligation_id uuid references public.compliance_obligations (id) on delete set null,
  title text not null,
  status text not null default 'active'
    check (status in ('draft', 'active', 'under_review', 'retired')),
  applicability_status text not null default 'assigned'
    check (applicability_status in ('assigned', 'under_review', 'not_applicable')),
  owner_id uuid references public.profiles (id),
  justification_note text,
  applicability_rules_snapshot jsonb not null default '{}'::jsonb,
  matched_rules_snapshot jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id)
);

create index if not exists legal_register_org_site_idx
  on public.legal_register_entries (organization_id, site_id, status);

create table if not exists public.compliance_requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  legal_register_entry_id uuid references public.legal_register_entries (id) on delete cascade,
  site_id uuid references public.sites (id) on delete cascade,
  title text not null,
  description text,
  frequency text not null default 'annual'
    check (frequency in ('one_time', 'monthly', 'quarterly', 'annual', 'event_based')),
  owner_id uuid references public.profiles (id),
  checklist_template_id uuid references public.checklist_templates (id) on delete set null,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'assessed', 'closed', 'not_applicable')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists compliance_requirements_org_site_idx
  on public.compliance_requirements (organization_id, site_id, status);

create table if not exists public.compliance_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  requirement_id uuid references public.compliance_requirements (id) on delete set null,
  legal_register_entry_id uuid references public.legal_register_entries (id) on delete set null,
  site_id uuid references public.sites (id) on delete set null,
  checklist_assignment_id uuid references public.checklist_assignments (id) on delete set null,
  period_label text not null,
  status text not null default 'draft'
    check (status in ('draft', 'in_progress', 'completed', 'reviewed', 'closed', 'cancelled')),
  score_percent numeric,
  findings_count integer not null default 0,
  rules_snapshot jsonb not null default '{}'::jsonb,
  profile_snapshot jsonb not null default '{}'::jsonb,
  framework_version text,
  notes text,
  conducted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id)
);

create index if not exists compliance_assessments_org_idx
  on public.compliance_assessments (organization_id, period_label, status);

create table if not exists public.applicability_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  evaluated_at timestamptz not null default timezone('utc', now()),
  profile_snapshot jsonb not null default '{}'::jsonb,
  results jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles (id)
);

-- ---------------------------------------------------------------------------
-- Regulatory licenses / consents (NOT EHS PTW `permits`)
-- ---------------------------------------------------------------------------
create table if not exists public.regulatory_permits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid references public.sites (id) on delete set null,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  legal_register_entry_id uuid references public.legal_register_entries (id) on delete set null,
  name text not null,
  license_number text,
  issuing_authority text,
  issued_on date,
  expires_on date,
  status text not null default 'active'
    check (status in ('draft', 'active', 'expired', 'surrendered', 'under_renewal')),
  controlled_document_id uuid references public.controlled_documents (id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id)
);

create index if not exists regulatory_permits_org_idx
  on public.regulatory_permits (organization_id, expires_on, status);

create table if not exists public.permit_conditions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  regulatory_permit_id uuid not null references public.regulatory_permits (id) on delete cascade,
  condition_text text not null,
  due_date date,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'met', 'overdue', 'waived')),
  owner_id uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Regulatory change workflow (data model only — not live monitoring)
-- ---------------------------------------------------------------------------
create table if not exists public.regulatory_updates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  regulation_id uuid references public.regulations (id) on delete set null,
  title text not null,
  summary text,
  published_on date,
  source_url text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id)
);

create table if not exists public.regulatory_update_impacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  update_id uuid not null references public.regulatory_updates (id) on delete cascade,
  legal_register_entry_id uuid references public.legal_register_entries (id) on delete set null,
  requirement_id uuid references public.compliance_requirements (id) on delete set null,
  impact_status text not null default 'pending_review'
    check (impact_status in ('pending_review', 'applicable', 'not_applicable', 'actioned')),
  notes text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Reporting frameworks (BRSR as seed metadata, not TS questions)
-- ---------------------------------------------------------------------------
create table if not exists public.reporting_frameworks (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  version text not null default '1',
  publisher text,
  description text,
  is_active boolean not null default true,
  unique (code, version)
);

create table if not exists public.reporting_framework_sections (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.reporting_frameworks (id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  unique (framework_id, code)
);

create table if not exists public.reporting_framework_indicators (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.reporting_framework_sections (id) on delete cascade,
  code text not null,
  title text not null,
  unit text,
  guidance text,
  is_core boolean not null default false,
  sort_order integer not null default 0,
  unique (section_id, code)
);

create table if not exists public.esg_metric_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  framework_indicator_id uuid references public.reporting_framework_indicators (id) on delete set null,
  code text not null,
  name text not null,
  unit text,
  description text,
  source_type text not null default 'manual'
    check (source_type in ('manual', 'computed', 'ehs_events', 'ghg')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists esg_metric_def_platform_code_uidx
  on public.esg_metric_definitions (code)
  where organization_id is null;

create unique index if not exists esg_metric_def_org_code_uidx
  on public.esg_metric_definitions (organization_id, code)
  where organization_id is not null;

create table if not exists public.esg_metric_values (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  definition_id uuid references public.esg_metric_definitions (id) on delete set null,
  metric_key text not null,
  period text not null,
  value numeric,
  unit text,
  notes text,
  source text not null default 'manual',
  recorded_at timestamptz not null default timezone('utc', now()),
  recorded_by uuid references public.profiles (id)
);

create index if not exists esg_metric_values_org_period_idx
  on public.esg_metric_values (organization_id, period, metric_key, recorded_at desc);

create table if not exists public.esg_reporting_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  period_label text not null,
  period_start date,
  period_end date,
  status text not null default 'open'
    check (status in ('open', 'closed', 'locked')),
  unique (organization_id, period_label)
);

alter table public.compliance_evidence
  drop constraint if exists compliance_evidence_legal_register_fk;
alter table public.compliance_evidence
  add constraint compliance_evidence_legal_register_fk
  foreign key (legal_register_entry_id) references public.legal_register_entries (id) on delete set null;
alter table public.compliance_evidence
  drop constraint if exists compliance_evidence_requirement_fk;
alter table public.compliance_evidence
  add constraint compliance_evidence_requirement_fk
  foreign key (requirement_id) references public.compliance_requirements (id) on delete set null;
alter table public.compliance_evidence
  drop constraint if exists compliance_evidence_assessment_fk;
alter table public.compliance_evidence
  add constraint compliance_evidence_assessment_fk
  foreign key (assessment_id) references public.compliance_assessments (id) on delete set null;
alter table public.compliance_evidence
  drop constraint if exists compliance_evidence_reg_permit_fk;
alter table public.compliance_evidence
  add constraint compliance_evidence_reg_permit_fk
  foreign key (regulatory_permit_id) references public.regulatory_permits (id) on delete set null;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.jurisdictions enable row level security;
alter table public.regulations enable row level security;
alter table public.legal_register_entries enable row level security;
alter table public.compliance_requirements enable row level security;
alter table public.compliance_assessments enable row level security;
alter table public.applicability_snapshots enable row level security;
alter table public.regulatory_permits enable row level security;
alter table public.permit_conditions enable row level security;
alter table public.regulatory_updates enable row level security;
alter table public.regulatory_update_impacts enable row level security;
alter table public.reporting_frameworks enable row level security;
alter table public.reporting_framework_sections enable row level security;
alter table public.reporting_framework_indicators enable row level security;
alter table public.esg_metric_definitions enable row level security;
alter table public.esg_metric_values enable row level security;
alter table public.esg_reporting_periods enable row level security;

drop policy if exists jurisdictions_select on public.jurisdictions;
create policy jurisdictions_select on public.jurisdictions
  for select using (
    auth.uid() is not null
    and (organization_id is null or public.is_platform_admin() or public.is_org_member(organization_id))
  );
drop policy if exists jurisdictions_write on public.jurisdictions;
create policy jurisdictions_write on public.jurisdictions
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  );

drop policy if exists regulations_select on public.regulations;
create policy regulations_select on public.regulations
  for select using (
    auth.uid() is not null
    and (organization_id is null or public.is_platform_admin() or public.is_org_member(organization_id))
  );
drop policy if exists regulations_write on public.regulations;
create policy regulations_write on public.regulations
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  );

drop policy if exists reporting_frameworks_select on public.reporting_frameworks;
create policy reporting_frameworks_select on public.reporting_frameworks
  for select using (auth.uid() is not null);
drop policy if exists reporting_frameworks_admin on public.reporting_frameworks;
create policy reporting_frameworks_admin on public.reporting_frameworks
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists reporting_framework_sections_select on public.reporting_framework_sections;
create policy reporting_framework_sections_select on public.reporting_framework_sections
  for select using (auth.uid() is not null);
drop policy if exists reporting_framework_sections_admin on public.reporting_framework_sections;
create policy reporting_framework_sections_admin on public.reporting_framework_sections
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists reporting_framework_indicators_select on public.reporting_framework_indicators;
create policy reporting_framework_indicators_select on public.reporting_framework_indicators
  for select using (auth.uid() is not null);
drop policy if exists reporting_framework_indicators_admin on public.reporting_framework_indicators;
create policy reporting_framework_indicators_admin on public.reporting_framework_indicators
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists esg_metric_definitions_select on public.esg_metric_definitions;
create policy esg_metric_definitions_select on public.esg_metric_definitions
  for select using (
    auth.uid() is not null
    and (organization_id is null or public.is_platform_admin() or public.is_org_member(organization_id))
  );
drop policy if exists esg_metric_definitions_write on public.esg_metric_definitions;
create policy esg_metric_definitions_write on public.esg_metric_definitions
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  );

drop policy if exists regulatory_updates_select on public.regulatory_updates;
create policy regulatory_updates_select on public.regulatory_updates
  for select using (
    auth.uid() is not null
    and (organization_id is null or public.is_platform_admin() or public.is_org_member(organization_id))
  );
drop policy if exists regulatory_updates_write on public.regulatory_updates;
create policy regulatory_updates_write on public.regulatory_updates
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  );

do $$
declare t text;
begin
  foreach t in array array[
    'legal_register_entries','compliance_requirements','compliance_assessments',
    'applicability_snapshots','regulatory_permits','permit_conditions',
    'regulatory_update_impacts','esg_metric_values','esg_reporting_periods'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_tenant', t);
    execute format(
      'create policy %I on public.%I for all using (public.is_platform_admin() or public.is_org_member(organization_id)) with check (public.is_platform_admin() or public.is_org_member(organization_id))',
      t || '_tenant', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Seed catalog metadata (structure only; not an applicability engine)
-- ---------------------------------------------------------------------------
insert into public.jurisdictions (organization_id, code, name, country_code, level)
values
  (null, 'IN', 'India', 'IN', 'country'),
  (null, 'EU', 'European Union', null, 'supranational'),
  (null, 'UNSET', 'Unspecified', null, 'other')
on conflict do nothing;

insert into public.regulations (
  organization_id, jurisdiction_id, obligation_id, code, title, issuing_authority, citation, summary
)
select
  null,
  case when o.code = 'CBAM_EMBEDDED' then eu.id else inn.id end,
  o.id,
  o.code,
  o.title,
  o.issuing_authority,
  o.source_reference,
  o.description
from public.compliance_obligations o
left join public.jurisdictions inn on inn.code = 'IN' and inn.organization_id is null
left join public.jurisdictions eu on eu.code = 'EU' and eu.organization_id is null
on conflict do nothing;

insert into public.reporting_frameworks (code, name, version, publisher, description)
values (
  'brsr',
  'Business Responsibility and Sustainability Report',
  'catalog-v1',
  'SEBI (catalog attribution)',
  'Orientation metadata for BRSR sections and Core-style indicators. Not official SEBI text, not legal advice, and not a filing pack.'
)
on conflict (code, version) do nothing;

insert into public.reporting_framework_sections (framework_id, code, title, description, sort_order)
select f.id, s.code, s.title, s.description, s.sort_order
from public.reporting_frameworks f
join (values
  ('A', 'Section A — General disclosures', 'Organization identity and profile fields mapped from tenant data.', 10),
  ('B', 'Section B — Management and process disclosures', 'NGRBC principle process disclosures entered by the tenant.', 20),
  ('C', 'Section C — Principle-wise / Core performance', 'Indicators with values only when the tenant records them.', 30)
) as s(code, title, description, sort_order) on true
where f.code = 'brsr' and f.version = 'catalog-v1'
on conflict (framework_id, code) do nothing;

insert into public.reporting_framework_indicators (section_id, code, title, unit, guidance, is_core, sort_order)
select sec.id, i.code, i.title, i.unit, i.guidance, i.is_core, i.sort_order
from public.reporting_framework_sections sec
join public.reporting_frameworks f on f.id = sec.framework_id
join (values
  ('C', 'ghg_emissions', 'GHG emissions (Scope 1+2)', 'tCO2e', 'Use tenant GHG inventory rows. Do not invent totals.', true, 10),
  ('C', 'water_consumption', 'Water consumption', 'KL', 'Record only if measured.', true, 20),
  ('C', 'energy_consumption', 'Energy consumption', 'GJ', 'Record only if measured.', true, 30),
  ('C', 'waste_generated', 'Waste generated', 'MT', 'Record only if measured.', true, 40),
  ('C', 'employee_health_safety', 'Employee health & safety (incident count)', 'incidents', 'Computed from EHS incidents when synced. Not TRIR unless hours exist.', true, 50),
  ('C', 'gender_diversity', 'Gender diversity (women % of workforce)', '%', 'Manual tenant entry.', true, 60),
  ('C', 'job_creation_local', 'Job creation in smaller districts', 'count', 'Manual tenant entry.', true, 70),
  ('C', 'anti_corruption', 'Anti-corruption training coverage', '%', 'Manual tenant entry.', true, 80),
  ('C', 'supplier_engagement', 'Supplier ESG assessment coverage', '%', 'Manual tenant entry.', true, 90),
  ('B', 'P1', 'Ethics, transparency and accountability', null, 'Process disclosure — tenant narrative.', false, 10),
  ('B', 'P2', 'Safe and sustainable goods and services', null, 'Process disclosure — tenant narrative.', false, 20),
  ('B', 'P3', 'Employee well-being', null, 'Process disclosure — tenant narrative.', false, 30),
  ('B', 'P4', 'Stakeholder inclusiveness', null, 'Process disclosure — tenant narrative.', false, 40),
  ('B', 'P5', 'Human rights', null, 'Process disclosure — tenant narrative.', false, 50),
  ('B', 'P6', 'Environment', null, 'Process disclosure — tenant narrative.', false, 60),
  ('B', 'P7', 'Public policy advocacy', null, 'Process disclosure — tenant narrative.', false, 70),
  ('B', 'P8', 'Inclusive growth', null, 'Process disclosure — tenant narrative.', false, 80),
  ('B', 'P9', 'Customer value', null, 'Process disclosure — tenant narrative.', false, 90)
) as i(section_code, code, title, unit, guidance, is_core, sort_order)
  on sec.code = i.section_code
where f.code = 'brsr' and f.version = 'catalog-v1'
on conflict (section_id, code) do nothing;

insert into public.esg_metric_definitions (organization_id, framework_indicator_id, code, name, unit, description, source_type)
select null, ind.id, ind.code, ind.title, ind.unit, ind.guidance,
  case when ind.code = 'employee_health_safety' then 'ehs_events'
       when ind.code = 'ghg_emissions' then 'ghg'
       else 'manual' end
from public.reporting_framework_indicators ind
join public.reporting_framework_sections sec on sec.id = ind.section_id
join public.reporting_frameworks f on f.id = sec.framework_id
where f.code = 'brsr' and ind.is_core = true
on conflict do nothing;
