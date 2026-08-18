-- Phase 13: Executive analytics + EHS Control Tower
-- Config/cache tables only — do not duplicate transactional facts.

-- ---------------------------------------------------------------------------
-- Features & permissions (copy plan grants from advanced_analytics — no plan names)
-- ---------------------------------------------------------------------------
insert into public.features (code, name, description, category, value_type)
values
  ('executive_analytics', 'Executive Analytics', 'EHS Control Tower and executive dashboards', 'module', 'boolean')
on conflict (code) do nothing;

update public.features
set catalog_group = 'analytics'
where code in ('executive_analytics', 'advanced_analytics', 'advanced_reports', 'scheduled_reports');

insert into public.plan_features (plan_id, feature_id, enabled, limit_value, unlimited)
select pf.plan_id, nf.id, pf.enabled, pf.limit_value, pf.unlimited
from public.plan_features pf
join public.features ofeat on ofeat.id = pf.feature_id and ofeat.code = 'advanced_analytics'
join public.features nf on nf.code = 'executive_analytics'
on conflict (plan_id, feature_id) do update set enabled = excluded.enabled;

insert into public.permissions (code, module, action, description) values
  ('analytics.manage', 'analytics', 'manage', 'Configure analytics metrics, targets, and saved views')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and p.code = 'analytics.manage'
  and r.code in ('super_admin', 'tenant_admin', 'ehs_admin', 'ehs_manager')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and p.code = 'analytics.view'
  and r.code in (
    'super_admin', 'tenant_admin', 'ehs_admin', 'ehs_manager', 'ehs_officer',
    'site_manager', 'auditor', 'viewer', 'department_head'
  )
on conflict do nothing;

-- Site-scoped CAPA aggregates (column is additive; engine unchanged)
alter table public.capa_items
  add column if not exists site_id uuid references public.sites (id);

create index if not exists capa_items_org_site_idx
  on public.capa_items (organization_id, site_id)
  where deleted_at is null;

-- Fiscal year start month (1–12). Default April (India FY) when unset.
alter table public.organization_settings
  add column if not exists fiscal_year_start_month integer not null default 4
    check (fiscal_year_start_month between 1 and 12),
  add column if not exists analytics_health_config jsonb not null default '{}'::jsonb;

-- Optional workforce hours denominator (entered, never invented)
create table if not exists public.workforce_hours (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid references public.sites (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  period_start date not null,
  period_end date not null,
  hours numeric(14, 2) not null check (hours >= 0),
  source text not null default 'manual'
    check (source in ('manual', 'import', 'hrms')),
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists workforce_hours_org_site_period_uidx
  on public.workforce_hours (
    organization_id,
    coalesce(site_id, '00000000-0000-0000-0000-000000000000'::uuid),
    period_start,
    period_end
  );

create index if not exists workforce_hours_org_period_idx
  on public.workforce_hours (organization_id, period_start, period_end);

-- Metric catalog (system + org overrides)
create table if not exists public.metric_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  description text not null,
  module text not null,
  polarity text not null default 'higher-is-worse'
    check (polarity in ('higher-is-worse', 'higher-is-better', 'neutral')),
  classification text not null default 'lagging'
    check (classification in ('leading', 'lagging', 'denominator', 'composite')),
  unit text not null default 'count',
  formula_notes text not null,
  drilldown_path text,
  requires_hours boolean not null default false,
  requires_effectiveness boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists metric_definitions_system_uidx
  on public.metric_definitions (code)
  where organization_id is null;

create unique index if not exists metric_definitions_org_uidx
  on public.metric_definitions (organization_id, code)
  where organization_id is not null;

create table if not exists public.metric_targets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  metric_code text not null,
  site_id uuid references public.sites (id) on delete cascade,
  period_kind text not null default 'fy'
    check (period_kind in ('month', 'quarter', 'fy', 'custom')),
  period_start date,
  period_end date,
  target_value numeric,
  warning_value numeric,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists metric_targets_org_idx
  on public.metric_targets (organization_id, metric_code);

create table if not exists public.dashboard_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  audience_role_code text,
  feature_code text not null default 'advanced_analytics',
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists dashboard_definitions_system_uidx
  on public.dashboard_definitions (code)
  where organization_id is null;

create unique index if not exists dashboard_definitions_org_uidx
  on public.dashboard_definitions (organization_id, code)
  where organization_id is not null;

create table if not exists public.dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  dashboard_id uuid not null references public.dashboard_definitions (id) on delete cascade,
  widget_type text not null
    check (widget_type in ('kpi', 'trend', 'bar', 'table', 'heatmap', 'summary', 'health_score')),
  title text not null,
  metric_code text,
  config jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists dashboard_widgets_dash_idx
  on public.dashboard_widgets (dashboard_id, sort_order);

create table if not exists public.dashboard_layouts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  dashboard_id uuid not null references public.dashboard_definitions (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  layout jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (dashboard_id, user_id)
);

create table if not exists public.saved_views (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  owner_user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  href_path text not null,
  filters jsonb not null default '{}'::jsonb,
  is_shared boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists saved_views_org_owner_idx
  on public.saved_views (organization_id, owner_user_id);

create table if not exists public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  snapshot_key text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  scope jsonb not null default '{}'::jsonb,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, snapshot_key, period_start, period_end)
);

create table if not exists public.benchmark_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  metric_code text not null,
  label text not null,
  value numeric,
  source_notes text not null default 'Internal target only — not an industry claim.',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.report_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  dashboard_code text not null default 'executive_control_tower',
  cadence text not null default 'weekly'
    check (cadence in ('daily', 'weekly', 'monthly')),
  channel text not null default 'in_app'
    check (channel in ('in_app', 'email')),
  recipients jsonb not null default '[]'::jsonb,
  filters jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  last_run_at timestamptz,
  last_error text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists report_schedules_org_idx
  on public.report_schedules (organization_id, is_active);

create table if not exists public.analytics_alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  source_type text not null,
  source_id text not null,
  alert_type text not null,
  severity text not null default 'watch'
    check (severity in ('info', 'watch', 'critical')),
  title text not null,
  href text,
  site_id uuid references public.sites (id) on delete set null,
  detected_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  unique (organization_id, source_type, source_id, alert_type)
);

create index if not exists analytics_alerts_org_open_idx
  on public.analytics_alerts (organization_id, detected_at desc)
  where resolved_at is null;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.workforce_hours enable row level security;
alter table public.metric_definitions enable row level security;
alter table public.metric_targets enable row level security;
alter table public.dashboard_definitions enable row level security;
alter table public.dashboard_widgets enable row level security;
alter table public.dashboard_layouts enable row level security;
alter table public.saved_views enable row level security;
alter table public.analytics_snapshots enable row level security;
alter table public.benchmark_definitions enable row level security;
alter table public.report_schedules enable row level security;
alter table public.analytics_alerts enable row level security;

drop policy if exists workforce_hours_select on public.workforce_hours;
create policy workforce_hours_select on public.workforce_hours
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists workforce_hours_mutate on public.workforce_hours;
create policy workforce_hours_mutate on public.workforce_hours
  for all using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'analytics.manage')
    or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'analytics.manage')
    or public.has_org_permission(organization_id, 'settings.manage')
  );

drop policy if exists metric_definitions_select on public.metric_definitions;
create policy metric_definitions_select on public.metric_definitions
  for select using (
    organization_id is null
    or public.is_platform_admin()
    or public.is_org_member(organization_id)
  );
drop policy if exists metric_definitions_mutate on public.metric_definitions;
create policy metric_definitions_mutate on public.metric_definitions
  for all using (
    organization_id is not null
    and (
      public.is_platform_admin()
      or public.has_org_permission(organization_id, 'analytics.manage')
    )
  )
  with check (
    organization_id is not null
    and (
      public.is_platform_admin()
      or public.has_org_permission(organization_id, 'analytics.manage')
    )
  );

drop policy if exists metric_targets_select on public.metric_targets;
create policy metric_targets_select on public.metric_targets
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists metric_targets_mutate on public.metric_targets;
create policy metric_targets_mutate on public.metric_targets
  for all using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'analytics.manage')
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'analytics.manage')
  );

drop policy if exists dashboard_definitions_select on public.dashboard_definitions;
create policy dashboard_definitions_select on public.dashboard_definitions
  for select using (
    organization_id is null
    or public.is_platform_admin()
    or public.is_org_member(organization_id)
  );
drop policy if exists dashboard_definitions_mutate on public.dashboard_definitions;
create policy dashboard_definitions_mutate on public.dashboard_definitions
  for all using (
    organization_id is not null
    and (
      public.is_platform_admin()
      or public.has_org_permission(organization_id, 'analytics.manage')
    )
  )
  with check (
    organization_id is not null
    and (
      public.is_platform_admin()
      or public.has_org_permission(organization_id, 'analytics.manage')
    )
  );

drop policy if exists dashboard_widgets_select on public.dashboard_widgets;
create policy dashboard_widgets_select on public.dashboard_widgets
  for select using (
    organization_id is null
    or public.is_platform_admin()
    or public.is_org_member(organization_id)
  );
drop policy if exists dashboard_widgets_mutate on public.dashboard_widgets;
create policy dashboard_widgets_mutate on public.dashboard_widgets
  for all using (
    organization_id is not null
    and (
      public.is_platform_admin()
      or public.has_org_permission(organization_id, 'analytics.manage')
    )
  )
  with check (
    organization_id is not null
    and (
      public.is_platform_admin()
      or public.has_org_permission(organization_id, 'analytics.manage')
    )
  );

drop policy if exists dashboard_layouts_select on public.dashboard_layouts;
create policy dashboard_layouts_select on public.dashboard_layouts
  for select using (
    public.is_platform_admin()
    or public.is_org_member(organization_id)
  );
drop policy if exists dashboard_layouts_mutate on public.dashboard_layouts;
create policy dashboard_layouts_mutate on public.dashboard_layouts
  for all using (
    public.is_platform_admin()
    or (public.is_org_member(organization_id) and (user_id = auth.uid() or public.has_org_permission(organization_id, 'analytics.manage')))
  )
  with check (
    public.is_platform_admin()
    or (public.is_org_member(organization_id) and (user_id = auth.uid() or public.has_org_permission(organization_id, 'analytics.manage')))
  );

drop policy if exists saved_views_select on public.saved_views;
create policy saved_views_select on public.saved_views
  for select using (
    public.is_platform_admin()
    or (public.is_org_member(organization_id) and (owner_user_id = auth.uid() or is_shared))
  );
drop policy if exists saved_views_mutate on public.saved_views;
create policy saved_views_mutate on public.saved_views
  for all using (
    public.is_platform_admin()
    or (public.is_org_member(organization_id) and owner_user_id = auth.uid())
  )
  with check (
    public.is_platform_admin()
    or (public.is_org_member(organization_id) and owner_user_id = auth.uid())
  );

drop policy if exists analytics_snapshots_select on public.analytics_snapshots;
create policy analytics_snapshots_select on public.analytics_snapshots
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists analytics_snapshots_mutate on public.analytics_snapshots;
create policy analytics_snapshots_mutate on public.analytics_snapshots
  for all using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'analytics.manage')
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'analytics.manage')
  );

drop policy if exists benchmark_definitions_select on public.benchmark_definitions;
create policy benchmark_definitions_select on public.benchmark_definitions
  for select using (
    organization_id is null
    or public.is_platform_admin()
    or public.is_org_member(organization_id)
  );
drop policy if exists benchmark_definitions_mutate on public.benchmark_definitions;
create policy benchmark_definitions_mutate on public.benchmark_definitions
  for all using (
    organization_id is not null
    and (
      public.is_platform_admin()
      or public.has_org_permission(organization_id, 'analytics.manage')
    )
  )
  with check (
    organization_id is not null
    and (
      public.is_platform_admin()
      or public.has_org_permission(organization_id, 'analytics.manage')
    )
  );

drop policy if exists report_schedules_select on public.report_schedules;
create policy report_schedules_select on public.report_schedules
  for select using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'analytics.view')
    or public.has_org_permission(organization_id, 'reports.view')
  );
drop policy if exists report_schedules_mutate on public.report_schedules;
create policy report_schedules_mutate on public.report_schedules
  for all using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'analytics.manage')
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'analytics.manage')
  );

drop policy if exists analytics_alerts_select on public.analytics_alerts;
create policy analytics_alerts_select on public.analytics_alerts
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
drop policy if exists analytics_alerts_mutate on public.analytics_alerts;
create policy analytics_alerts_mutate on public.analytics_alerts
  for all using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'analytics.manage')
    or public.has_org_permission(organization_id, 'analytics.view')
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'analytics.manage')
    or public.has_org_permission(organization_id, 'analytics.view')
  );

-- ---------------------------------------------------------------------------
-- System metric catalog
-- ---------------------------------------------------------------------------
insert into public.metric_definitions (
  organization_id, code, name, description, module, polarity, classification, unit, formula_notes, drilldown_path, requires_hours, requires_effectiveness, sort_order
) values
  (null, 'incident_count', 'Incidents', 'Count of incident records in the selected period.', 'incidents', 'higher-is-worse', 'lagging', 'count',
   'Count of ehs_events whose event type is incident, occurred_at in the org-timezone period, not deleted. Status filters apply when set.',
   '/app/incidents', false, false, 10),
  (null, 'open_incidents', 'Open incidents', 'Incidents still in workflow.', 'incidents', 'higher-is-worse', 'lagging', 'count',
   'Incident records in the period whose status is submitted, triage, investigation, capa, verification, approval, or reopened.',
   '/app/incidents', false, false, 20),
  (null, 'critical_incidents', 'Critical incidents', 'Incidents at critical severity rank.', 'incidents', 'higher-is-worse', 'lagging', 'count',
   'Incidents in the period whose severity rank is >= 4 or severity code is critical.',
   '/app/incidents', false, false, 30),
  (null, 'lost_time_injuries', 'Lost-time injuries', 'Injury rows marked lost_time.', 'incidents', 'higher-is-worse', 'lagging', 'count',
   'Count of ehs_event_injuries.lost_time = true linked to accessible incident records in the period. Not a rate.',
   '/app/incidents', false, false, 40),
  (null, 'near_miss_count', 'Near misses', 'Near-miss reports in the period.', 'incidents', 'higher-is-better', 'leading', 'count',
   'Count of ehs_events typed near_miss in the period. Higher reporting is treated as a leading indicator of reporting culture, not as harm.',
   '/app/near-misses', false, false, 50),
  (null, 'uauc_count', 'UA / UC', 'Unsafe act and unsafe condition reports.', 'incidents', 'higher-is-worse', 'leading', 'count',
   'Count of unsafe_act + unsafe_condition events in the period.',
   '/app/hazards', false, false, 60),
  (null, 'high_residual_risk', 'High residual risk', 'Hazards remaining in high/extreme residual band.', 'risk', 'higher-is-worse', 'leading', 'count',
   'risk_hazards where residual_band matches high|extreme|critical, or likelihood × consequence >= 15 when band is empty.',
   '/app/risk-register', false, false, 70),
  (null, 'open_capa', 'Open CAPA', 'CAPA items not yet verified or closed.', 'capa', 'higher-is-worse', 'lagging', 'count',
   'capa_items in open, in_progress, or pending_verification. Point-in-time, not period-created unless a created_at filter is applied for trends.',
   '/app/capa', false, false, 80),
  (null, 'overdue_capa', 'Overdue CAPA', 'Open CAPA past due date.', 'capa', 'higher-is-worse', 'lagging', 'count',
   'Open CAPA with due_date < organization-local today. Overdue is derived, never a stored status.',
   '/app/capa', false, false, 90),
  (null, 'capa_effectiveness', 'CAPA effectiveness', 'Verified CAPA with effectiveness evidence.', 'capa', 'higher-is-better', 'lagging', 'percent',
   'Verified or closed CAPA that have verified_at set, as a share of closed-loop items. If none have verification timestamps: No effectiveness data available.',
   '/app/capa', false, true, 100),
  (null, 'inspection_completion', 'Inspection completion', 'Completed inspections / active inspections.', 'inspections', 'higher-is-better', 'leading', 'percent',
   'checklist_assignments of type inspection, excluding cancelled. Completed statuses match the shared inspectionCompletion helper.',
   '/app/inspections', false, false, 110),
  (null, 'open_findings', 'Open findings', 'Inspection/audit findings still open.', 'audits', 'higher-is-worse', 'lagging', 'count',
   'checklist_findings in open or capa_linked.',
   '/app/findings', false, false, 120),
  (null, 'active_permits', 'Active permits', 'PTW currently live.', 'permits', 'neutral', 'leading', 'count',
   'permits in active, authorization, or approval_required.',
   '/app/permits/active', false, false, 130),
  (null, 'training_overdue', 'Training overdue', 'Assignments past due or expired.', 'training', 'higher-is-worse', 'leading', 'count',
   'training_assignments expired, or due_date < today and not completed/cancelled. Site-scoped users only see this when assignments can be scoped; otherwise omitted from site totals.',
   '/app/training', false, false, 140),
  (null, 'contractor_score', 'Contractor safety score', 'Average recorded contractor safety_score.', 'contractors', 'higher-is-better', 'lagging', 'score',
   'Average of contractor_companies.safety_score where a numeric score exists. Missing scores are excluded, never invented.',
   '/app/contractors', false, false, 150),
  (null, 'compliance_overdue', 'Overdue filings', 'Compliance task instances overdue.', 'compliance', 'higher-is-worse', 'lagging', 'count',
   'compliance_task_instances with due_date < org-local today and status in open, in_progress, overdue. Same definition as executive compliance.',
   '/app/compliance/calendar', false, false, 160),
  (null, 'expired_licenses', 'Expired licenses', 'Regulatory permits past expiry.', 'compliance', 'higher-is-worse', 'lagging', 'count',
   'regulatory_permits whose expires_on is before org-local today (evidence expiry helper).',
   '/app/compliance/licenses', false, false, 170),
  (null, 'workforce_hours', 'Workforce hours', 'Entered hours for rate denominators.', 'workforce', 'neutral', 'denominator', 'hours',
   'Sum of workforce_hours overlapping the selected period and accessible sites. Never estimated. Rates that need this denominator are withheld when the sum is 0.',
   '/app/analytics/workforce', true, false, 180);

insert into public.dashboard_definitions (
  organization_id, code, name, description, audience_role_code, feature_code, is_system, is_active
) values
  (null, 'executive_control_tower', 'EHS Control Tower', 'Organization leadership view of material EHS signals.', 'ehs_manager', 'executive_analytics', true, true),
  (null, 'site_operations', 'Site operations', 'Site-scoped KPIs for site managers and supervisors.', 'site_manager', 'advanced_analytics', true, true),
  (null, 'assurance', 'Assurance', 'Audits, inspections, CAPA, and findings.', 'auditor', 'advanced_analytics', true, true),
  (null, 'field_queue', 'My work', 'Personal open actions — not org totals.', 'employee', 'advanced_analytics', true, true);

grant select, insert, update, delete on
  public.workforce_hours,
  public.metric_definitions,
  public.metric_targets,
  public.dashboard_definitions,
  public.dashboard_widgets,
  public.dashboard_layouts,
  public.saved_views,
  public.analytics_snapshots,
  public.benchmark_definitions,
  public.report_schedules,
  public.analytics_alerts
to authenticated, service_role;
