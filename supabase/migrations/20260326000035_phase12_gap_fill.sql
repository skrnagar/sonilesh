-- Phase 12 gap fill: spec permissions, ESG verification history, integration hooks,
-- permit-condition findings (reuse checklist_findings). Catalog columns stay metadata.

-- ---------------------------------------------------------------------------
-- Permissions listed in the Phase 12 spec (existing keys are kept)
-- ---------------------------------------------------------------------------
insert into public.permissions (code, module, action, description) values
  ('compliance.create', 'compliance', 'create', 'Create compliance requirements and assessments'),
  ('compliance.assign', 'compliance', 'assign', 'Assign compliance owners'),
  ('compliance.review', 'compliance', 'review', 'Review compliance assessments'),
  ('compliance.approve', 'compliance', 'approve', 'Approve compliance assessments'),
  ('compliance.export', 'compliance', 'export', 'Export compliance records'),
  ('legal.view', 'compliance', 'view', 'View legal register (spec alias of legal_register.view)'),
  ('legal.manage', 'compliance', 'manage', 'Manage legal register (spec alias of legal_register.manage)'),
  ('legal.assign', 'compliance', 'assign', 'Assign legal register owners'),
  ('legal.review', 'compliance', 'review', 'Review legal register applicability'),
  ('esg.create', 'esg', 'create', 'Create ESG metric definitions and values'),
  ('esg.update', 'esg', 'update', 'Update current ESG metric values'),
  ('esg.verify', 'esg', 'verify', 'Verify ESG metric values'),
  ('esg.approve', 'esg', 'approve', 'Approve / publish ESG values and periods'),
  ('esg.export', 'esg', 'export', 'Export ESG / BRSR packs')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and (
    (r.code = 'compliance_officer' and p.code in (
      'compliance.create','compliance.assign','compliance.review','compliance.export',
      'legal.view','legal.manage','legal.assign','legal.review'
    ))
    or (r.code = 'company_secretary' and p.code in (
      'compliance.create','compliance.assign','compliance.review','compliance.approve','compliance.export',
      'legal.view','legal.manage','legal.assign','legal.review'
    ))
    or (r.code = 'esg_officer' and p.code in (
      'esg.create','esg.update','esg.verify','esg.approve','esg.export'
    ))
    or (r.code in ('tenant_admin', 'ehs_admin', 'super_admin') and p.code in (
      'compliance.create','compliance.assign','compliance.review','compliance.approve','compliance.export',
      'legal.view','legal.manage','legal.assign','legal.review',
      'esg.create','esg.update','esg.verify','esg.approve','esg.export'
    ))
  )
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Catalog metadata fields from the spec (not statute engines)
-- ---------------------------------------------------------------------------
alter table public.jurisdictions
  add column if not exists language text,
  add column if not exists currency_code text;

alter table public.regulations
  add column if not exists regulation_type text,
  add column if not exists review_date date,
  add column if not exists status text not null default 'active';

-- ---------------------------------------------------------------------------
-- Requirement → existing engines (hooks only)
-- ---------------------------------------------------------------------------
alter table public.compliance_requirements
  add column if not exists training_course_id uuid references public.training_courses (id) on delete set null,
  add column if not exists contractor_company_id uuid references public.contractor_companies (id) on delete set null,
  add column if not exists moc_request_id uuid references public.moc_requests (id) on delete set null,
  add column if not exists risk_assessment_id uuid references public.risk_assessments (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Permit condition failures reuse findings (assignment_id optional)
-- ---------------------------------------------------------------------------
alter table public.checklist_findings
  alter column assignment_id drop not null;

alter table public.checklist_findings
  add column if not exists permit_condition_id uuid references public.permit_conditions (id) on delete set null;

alter table public.permit_conditions
  add column if not exists finding_id uuid references public.checklist_findings (id) on delete set null,
  add column if not exists reminder_stage text not null default 'none';

alter table public.regulatory_permits
  add column if not exists reminder_stage text not null default 'none';

alter table public.compliance_evidence
  add column if not exists reminder_stage text not null default 'none';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'checklist_findings_source_chk'
  ) then
    alter table public.checklist_findings
      add constraint checklist_findings_source_chk
      check (assignment_id is not null or permit_condition_id is not null);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ESG verification (append-only history; values are not rewritten)
-- ---------------------------------------------------------------------------
alter table public.esg_metric_values
  add column if not exists verification_status text not null default 'draft',
  add column if not exists verified_by uuid references public.profiles (id),
  add column if not exists verified_at timestamptz;

alter table public.esg_reporting_periods
  drop constraint if exists esg_reporting_periods_status_check;

alter table public.esg_reporting_periods
  add constraint esg_reporting_periods_status_check
  check (status in (
    'open', 'data_collection', 'review', 'approved', 'published', 'closed', 'locked'
  ));

alter table public.esg_reporting_periods
  add column if not exists reminder_stage text not null default 'none';

create table if not exists public.esg_metric_verifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  metric_value_id uuid not null references public.esg_metric_values (id) on delete cascade,
  from_status text,
  to_status text not null
    check (to_status in ('draft', 'submitted', 'in_review', 'verified', 'published')),
  recorded_value numeric,
  recorded_unit text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id)
);

create index if not exists esg_metric_verifications_org_idx
  on public.esg_metric_verifications (organization_id, created_at desc);

alter table public.esg_metric_verifications enable row level security;

drop policy if exists esg_metric_verifications_tenant on public.esg_metric_verifications;
create policy esg_metric_verifications_tenant on public.esg_metric_verifications
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
