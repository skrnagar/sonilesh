-- EHS360 Enterprise Phase 12-13: MIS submissions and EHS scorecard tables

-- ---------------------------------------------------------------------------
-- MIS periods
-- ---------------------------------------------------------------------------
create table if not exists public.mis_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  label text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'open'
    check (status in ('open', 'closed', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  unique (organization_id, period_start, period_end)
);

create index if not exists mis_periods_org_idx on public.mis_periods (organization_id);

-- ---------------------------------------------------------------------------
-- MIS submissions
-- ---------------------------------------------------------------------------
create table if not exists public.mis_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  period_id uuid not null references public.mis_periods (id) on delete cascade,
  submission_number text not null,
  business_unit_id uuid references public.business_units (id) on delete set null,
  region_id uuid references public.regions (id) on delete set null,
  site_id uuid references public.sites (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  summary text not null default '',
  metrics jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'approved', 'rejected', 'cancelled')),
  submitted_at timestamptz,
  submitted_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id),
  review_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, submission_number)
);

create index if not exists mis_submissions_org_status_idx
  on public.mis_submissions (organization_id, status);

-- ---------------------------------------------------------------------------
-- EHS score periods
-- ---------------------------------------------------------------------------
create table if not exists public.ehs_score_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  label text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  overall_score numeric(5, 2),
  is_demo boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  unique (organization_id, period_start, period_end)
);

create index if not exists ehs_score_periods_org_idx on public.ehs_score_periods (organization_id);

-- ---------------------------------------------------------------------------
-- EHS score dimensions
-- ---------------------------------------------------------------------------
create table if not exists public.ehs_score_dimensions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  period_id uuid not null references public.ehs_score_periods (id) on delete cascade,
  dimension_key text not null,
  label text not null,
  weight numeric(5, 2) not null default 1,
  score numeric(5, 2) not null default 0,
  source text not null default 'calculated'
    check (source in ('calculated', 'manual', 'demo')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (period_id, dimension_key)
);

create index if not exists ehs_score_dimensions_period_idx
  on public.ehs_score_dimensions (period_id);

-- ---------------------------------------------------------------------------
-- EHS score snapshots (regional / site grain roll-ups)
-- ---------------------------------------------------------------------------
create table if not exists public.ehs_score_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  period_id uuid not null references public.ehs_score_periods (id) on delete cascade,
  business_unit_id uuid references public.business_units (id) on delete set null,
  region_id uuid references public.regions (id) on delete set null,
  site_id uuid references public.sites (id) on delete set null,
  overall_score numeric(5, 2) not null default 0,
  dimensions jsonb not null default '[]'::jsonb,
  is_demo boolean not null default false,
  computed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists ehs_score_snapshots_org_period_idx
  on public.ehs_score_snapshots (organization_id, period_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.mis_periods enable row level security;
alter table public.mis_submissions enable row level security;
alter table public.ehs_score_periods enable row level security;
alter table public.ehs_score_dimensions enable row level security;
alter table public.ehs_score_snapshots enable row level security;

create policy mis_periods_select on public.mis_periods
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));

create policy mis_periods_mutate on public.mis_periods
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );

create policy mis_submissions_select on public.mis_submissions
  for select using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'mis.view')
  );

create policy mis_submissions_insert on public.mis_submissions
  for insert with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'mis.create')
  );

create policy mis_submissions_update on public.mis_submissions
  for update using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'mis.edit')
    or public.has_org_permission(organization_id, 'mis.approve')
  )
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

create policy ehs_score_periods_select on public.ehs_score_periods
  for select using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'score.view')
  );

create policy ehs_score_periods_mutate on public.ehs_score_periods
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'score.create')
  )
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

create policy ehs_score_dimensions_select on public.ehs_score_dimensions
  for select using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'score.view')
  );

create policy ehs_score_dimensions_mutate on public.ehs_score_dimensions
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'score.edit')
  )
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

create policy ehs_score_snapshots_select on public.ehs_score_snapshots
  for select using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'score.view')
  );

create policy ehs_score_snapshots_mutate on public.ehs_score_snapshots
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'score.create')
  )
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

create trigger mis_periods_updated_at before update on public.mis_periods
  for each row execute function public.set_updated_at();
create trigger mis_submissions_updated_at before update on public.mis_submissions
  for each row execute function public.set_updated_at();
create trigger ehs_score_periods_updated_at before update on public.ehs_score_periods
  for each row execute function public.set_updated_at();
create trigger ehs_score_dimensions_updated_at before update on public.ehs_score_dimensions
  for each row execute function public.set_updated_at();
create trigger ehs_score_snapshots_updated_at before update on public.ehs_score_snapshots
  for each row execute function public.set_updated_at();
