-- Compliance library + ESG reporting (tenant-scoped tracking, platform-owned obligations)

insert into public.features (code, name, description, category, value_type) values
  ('regulatory_compliance', 'Regulatory Compliance', 'Statutory obligation tracking and filings', 'module', 'boolean'),
  ('esg_reporting', 'ESG / BRSR Reporting', 'BRSR, GHG, EPR, and ESG committee', 'module', 'boolean')
on conflict (code) do nothing;

insert into public.plan_features (plan_id, feature_id, enabled, limit_value, unlimited)
select p.id, f.id, true, null, false
from public.plans p
cross join public.features f
where f.code = 'regulatory_compliance'
  and p.code in ('starter', 'professional', 'business', 'enterprise', 'custom', 'free_trial')
on conflict (plan_id, feature_id) do update set enabled = true;

insert into public.plan_features (plan_id, feature_id, enabled, limit_value, unlimited)
select p.id, f.id, true, null, false
from public.plans p
cross join public.features f
where f.code = 'esg_reporting'
  and p.code in ('professional', 'business', 'enterprise', 'custom')
on conflict (plan_id, feature_id) do update set enabled = true;

insert into public.permissions (code, module, action, description) values
  ('compliance.view', 'compliance', 'view', 'View compliance calendar and tasks'),
  ('compliance.manage', 'compliance', 'manage', 'Manage applicability, filings, and evidence'),
  ('compliance.verify', 'compliance', 'verify', 'Verify a filing (not the filer)'),
  ('esg.view', 'esg', 'view', 'View ESG data and BRSR drafts'),
  ('esg.manage', 'esg', 'manage', 'Edit ESG metrics, GHG, committee, BRSR'),
  ('esg.comment', 'esg', 'comment', 'Comment on ESG materials')
on conflict (code) do nothing;

insert into public.roles (organization_id, code, name, description, is_system, is_default)
select null, v.code, v.name, v.description, true, false
from (values
  ('compliance_officer', 'Compliance Officer', 'Owns statutory obligations, tasks, and evidence across domains'),
  ('company_secretary', 'Company Secretary', 'Compliance officer plus secretarial/MCA and compliance dashboard'),
  ('esg_officer', 'ESG Officer', 'Owns ESG data, GHG inventory, EPR, and BRSR'),
  ('esg_committee_member', 'ESG Committee Member', 'Read/comment on ESG; no data-entry rights')
) as v(code, name, description)
where not exists (
  select 1 from public.roles r where r.organization_id is null and r.code = v.code
);

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and (
    (r.code = 'compliance_officer' and p.code in (
      'dashboard.view','compliance.view','compliance.manage','audit.view'
    ))
    or (r.code = 'company_secretary' and p.code in (
      'dashboard.view','compliance.view','compliance.manage','compliance.verify','audit.view','reports.view'
    ))
    or (r.code = 'esg_officer' and p.code in (
      'dashboard.view','esg.view','esg.manage','compliance.view','reports.view'
    ))
    or (r.code = 'esg_committee_member' and p.code in (
      'esg.view','esg.comment','dashboard.view'
    ))
    or (r.code in ('tenant_admin', 'ehs_admin') and p.code in (
      'compliance.view','compliance.manage','compliance.verify','esg.view','esg.manage'
    ))
    or (r.code = 'super_admin' and p.module in ('compliance', 'esg'))
  )
on conflict do nothing;

create table if not exists public.compliance_domains (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  sort_order integer not null default 0
);

create table if not exists public.compliance_obligations (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.compliance_domains (id),
  code text not null unique,
  title text not null,
  description text,
  issuing_authority text,
  frequency text not null check (frequency in ('one_time', 'monthly', 'quarterly', 'annual', 'event_based')),
  applicability_rules jsonb not null default '{}'::jsonb,
  penalty_description text,
  penalty_amount_note text,
  source_reference text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.org_compliance_profile (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  industry_sector text,
  sub_sectors text[] not null default '{}',
  is_listed boolean not null default false,
  market_cap_rank integer,
  turnover_band text,
  net_worth_band text,
  net_profit_band text,
  employee_count_band text,
  states_of_operation text[] not null default '{}',
  exports_to_eu boolean not null default false,
  waste_streams_generated text[] not null default '{}',
  ccts_sector boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles (id)
);

create table if not exists public.org_applicable_compliances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  obligation_id uuid not null references public.compliance_obligations (id),
  applicability_status text not null default 'auto_applied'
    check (applicability_status in ('auto_applied', 'manually_added', 'manually_excluded')),
  matched_rules jsonb not null default '[]'::jsonb,
  justification_note text,
  owner_id uuid references public.profiles (id),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'filed', 'overdue', 'not_applicable')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, obligation_id)
);

create table if not exists public.compliance_task_instances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  org_applicable_compliance_id uuid not null references public.org_applicable_compliances (id) on delete cascade,
  period_label text not null,
  due_date date not null,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'filed', 'verified', 'overdue', 'cancelled')),
  filed_date date,
  filed_by uuid references public.profiles (id),
  verified_by uuid references public.profiles (id),
  verified_at timestamptz,
  notes text,
  reminder_stage text not null default 'none'
    check (reminder_stage in ('none', 'd7', 'd1', 'overdue', 'escalate')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (org_applicable_compliance_id, period_label)
);

create index if not exists compliance_task_due_idx
  on public.compliance_task_instances (organization_id, due_date, status);

create table if not exists public.compliance_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  task_instance_id uuid references public.compliance_task_instances (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  uploaded_by uuid references public.profiles (id),
  uploaded_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.esg_committee (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  member_user_id uuid not null references public.profiles (id),
  role text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, member_user_id)
);

create table if not exists public.materiality_assessment (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  year integer not null,
  topic text not null,
  stakeholder_score integer not null check (stakeholder_score between 1 and 5),
  business_impact_score integer not null check (business_impact_score between 1 and 5),
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ghg_emissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid references public.sites (id),
  period_start date not null,
  period_end date not null,
  scope text not null check (scope in ('1', '2', '3')),
  category text,
  value_tco2e numeric not null,
  source_data_ref text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.esg_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  period text not null,
  metric_key text not null,
  value numeric,
  unit text,
  notes text,
  source text not null default 'manual',
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, period, metric_key)
);

create table if not exists public.epr_registrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  waste_stream text not null,
  registration_status text not null default 'not_registered',
  certificate_path text,
  annual_target numeric,
  annual_actual numeric,
  renewal_due date,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, waste_stream)
);

create table if not exists public.brsr_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  financial_year text not null,
  status text not null default 'draft'
    check (status in ('draft', 'assurance_in_progress', 'filed')),
  section_a jsonb not null default '{}'::jsonb,
  section_b jsonb not null default '{}'::jsonb,
  section_c jsonb not null default '{}'::jsonb,
  assurance_provider text,
  assurance_date date,
  filed_date date,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, financial_year)
);

alter table public.org_compliance_profile enable row level security;
alter table public.org_applicable_compliances enable row level security;
alter table public.compliance_task_instances enable row level security;
alter table public.compliance_evidence enable row level security;
alter table public.esg_committee enable row level security;
alter table public.materiality_assessment enable row level security;
alter table public.ghg_emissions enable row level security;
alter table public.esg_metrics enable row level security;
alter table public.epr_registrations enable row level security;
alter table public.brsr_reports enable row level security;
alter table public.compliance_domains enable row level security;
alter table public.compliance_obligations enable row level security;

drop policy if exists compliance_domains_select on public.compliance_domains;
create policy compliance_domains_select on public.compliance_domains
  for select using (auth.uid() is not null);

drop policy if exists compliance_obligations_select on public.compliance_obligations;
create policy compliance_obligations_select on public.compliance_obligations
  for select using (auth.uid() is not null);

drop policy if exists compliance_obligations_admin on public.compliance_obligations;
create policy compliance_obligations_admin on public.compliance_obligations
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

do $$
declare t text;
begin
  foreach t in array array[
    'org_compliance_profile','org_applicable_compliances','compliance_task_instances',
    'compliance_evidence','esg_committee','materiality_assessment','ghg_emissions',
    'esg_metrics','epr_registrations','brsr_reports'
  ] loop
    execute format(
      'drop policy if exists %I on public.%I',
      t || '_tenant', t
    );
    execute format(
      'create policy %I on public.%I for all using (public.is_platform_admin() or public.is_org_member(organization_id)) with check (public.is_platform_admin() or public.is_org_member(organization_id))',
      t || '_tenant', t
    );
  end loop;
end $$;

insert into public.compliance_domains (code, name, sort_order) values
  ('ehs', 'EHS', 10),
  ('environmental', 'Environmental', 20),
  ('labour', 'Labour', 30),
  ('secretarial', 'Secretarial / MCA', 40),
  ('tax', 'Tax / GST', 50),
  ('fema', 'FEMA / RBI', 60),
  ('industry', 'Industry-Specific', 70),
  ('esg_e', 'ESG — Environmental', 80),
  ('esg_s', 'ESG — Social', 90),
  ('esg_g', 'ESG — Governance', 100)
on conflict (code) do nothing;

insert into public.compliance_obligations (
  domain_id, code, title, description, issuing_authority, frequency,
  applicability_rules, penalty_description, penalty_amount_note, source_reference
)
select d.id, o.code, o.title, o.description, o.authority, o.frequency,
  o.rules::jsonb, o.penalty, o.penalty_note, o.source
from public.compliance_domains d
join (values
  ('tax', 'GST_GSTR3B', 'GSTR-3B monthly return', 'Monthly GST return for most registered persons.', 'GSTN / CBIC', 'monthly',
    '{}', 'Late fee and interest under the CGST Act for delayed filing.', 'Late fee plus interest on tax due', 'CGST Act'),
  ('labour', 'POSH_ANNUAL', 'POSH annual report to District Officer', 'Sexual Harassment of Women at Workplace Act annual report.', 'District Officer / MoWCD', 'annual',
    '{"min_employee_band":"51_250"}', 'Penalties for non-constitution of ICC and non-filing of annual report.', 'As notified under POSH Act', 'POSH Act 2013'),
  ('ehs', 'FACTORIES_ANNUAL', 'Factories Act returns / safety statistics', 'Annual returns and accident statistics where the Factories Act applies.', 'State Factories Inspectorate', 'annual',
    '{"sector_in":["manufacturing","epc","infrastructure","mining","oil_gas"]}', 'Prosecution and compounding under the Factories Act for delayed returns.', 'State-specific', 'Factories Act 1948'),
  ('environmental', 'HW_ANNUAL', 'Hazardous Waste annual return', 'Form 4 annual return under Hazardous and Other Wastes Rules.', 'SPCB / CPCB', 'annual',
    '{"waste_stream_in":["hazardous"]}', 'Environmental compensation and possible unit closure for non-filing.', 'As levied by SPCB/CPCB', 'HOWM Rules 2016'),
  ('environmental', 'EPR_PLASTIC', 'Plastic packaging EPR annual filing', 'PIBOs / PWPs annual EPR target vs actual under PWM Rules.', 'CPCB', 'annual',
    '{"waste_stream_in":["plastic"]}', 'Environmental compensation for shortfall against EPR targets.', 'CPCB EC guidelines', 'PWM Rules / EPR'),
  ('environmental', 'EPR_EWASTE', 'E-waste EPR annual filing', 'Producers annual e-waste EPR returns.', 'CPCB', 'annual',
    '{"waste_stream_in":["e-waste"]}', 'Environmental compensation and registration suspension.', 'CPCB', 'E-Waste Rules'),
  ('environmental', 'EPR_BATTERY', 'Battery waste EPR', 'Battery producer EPR returns.', 'CPCB', 'annual',
    '{"waste_stream_in":["battery"]}', 'Environmental compensation for non-compliance.', 'CPCB', 'Battery Waste Management Rules'),
  ('esg_e', 'BRSR_ANNUAL', 'BRSR with Annual Report (listed)', 'Business Responsibility and Sustainability Report for specified listed entities.', 'SEBI', 'annual',
    '{"is_listed":true,"min_market_cap_rank":1000}', 'SEBI listing-regulation consequences for non-disclosure by in-scope listed entities.', 'Listing obligations', 'SEBI BRSR / LODR'),
  ('esg_g', 'CSR2', 'MCA CSR-2 filing', 'CSR-2 form where CSR provisions of the Companies Act apply.', 'MCA', 'annual',
    '{"min_net_worth_band":"500cr_plus"}', 'MCA additional fees and possible adjudication for delayed CSR filings.', 'Companies Act additional fee', 'Companies Act s.135 / CSR-2'),
  ('esg_e', 'CBAM_EMBEDDED', 'CBAM embedded-emissions data (EU exports)', 'Quarterly/annual embedded emissions evidence for goods exported to the EU.', 'European Commission (CBAM)', 'quarterly',
    '{"exports_to_eu":true}', 'Importers in the EU cannot clear goods without required CBAM data — commercial blockage, not an Indian fine.', 'EU CBAM', 'EU CBAM Regulation'),
  ('esg_e', 'CCTS_GHG', 'CCTS / GHG intensity reporting', 'Intensity targets and reporting for CCTS-notified sectors.', 'BEE / MoEFCC', 'annual',
    '{"ccts_sector":true}', 'Non-compliance with intensity targets can attract carbon-credit purchase obligations.', 'CCTS rules', 'Carbon Credit Trading Scheme'),
  ('secretarial', 'AOC4', 'AOC-4 financial statements', 'Filing of financial statements with MCA.', 'MCA', 'annual',
    '{}', 'Additional filing fee that increases with delay under the Companies Act.', 'MCA additional fee slab', 'Companies Act'),
  ('industry', 'C_AND_D_WASTE', 'C&D waste management annual', 'Construction & demolition waste annual reporting where generated.', 'ULB / SPCB', 'annual',
    '{"waste_stream_in":["c_and_d"]}', 'Local body penalties for illegal dumping / non-reporting.', 'Municipal', 'C&D Waste Rules')
) as o(domain_code, code, title, description, authority, frequency, rules, penalty, penalty_note, source)
  on d.code = o.domain_code
on conflict (code) do nothing;
