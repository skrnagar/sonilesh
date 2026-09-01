-- EHS360 Enterprise Phase 1-2: regions, RBAC permissions, LMRA, site visits, UA/UC workflow columns

-- ---------------------------------------------------------------------------
-- Regions (between business unit and site)
-- ---------------------------------------------------------------------------
create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  business_unit_id uuid references public.business_units (id) on delete set null,
  name text not null,
  code text not null,
  description text,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  head_member_id uuid references public.organization_members (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, code)
);

create index if not exists regions_org_idx on public.regions (organization_id);
create index if not exists regions_bu_idx on public.regions (business_unit_id);

alter table public.sites
  add column if not exists region_id uuid references public.regions (id) on delete set null;

create index if not exists sites_region_idx on public.sites (region_id);

-- ---------------------------------------------------------------------------
-- UA/UC workflow extension columns on ehs_events
-- ---------------------------------------------------------------------------
alter table public.ehs_events
  add column if not exists allocated_at timestamptz,
  add column if not exists allocated_by uuid references public.profiles (id),
  add column if not exists assignee_closed_at timestamptz,
  add column if not exists final_closed_at timestamptz,
  add column if not exists uauc_stage text
    check (uauc_stage is null or uauc_stage in (
      'reported', 'allocated', 'action_in_progress', 'assignee_closed', 'final_closed'
    ));

-- ---------------------------------------------------------------------------
-- LMRA assessments (dedicated entity)
-- ---------------------------------------------------------------------------
create table if not exists public.lmra_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assessment_number text not null,
  site_id uuid references public.sites (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  business_unit_id uuid references public.business_units (id) on delete set null,
  activity_description text not null default '',
  risks jsonb not null default '[]'::jsonb,
  controls jsonb not null default '[]'::jsonb,
  immediate_action text,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at timestamptz,
  submitted_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id),
  review_notes text,
  permit_id uuid references public.permits (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, assessment_number)
);

create index if not exists lmra_assessments_org_status_idx
  on public.lmra_assessments (organization_id, status);

-- ---------------------------------------------------------------------------
-- Site visits (HSV / RSV / TSV stub)
-- ---------------------------------------------------------------------------
create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  visit_number text not null,
  visit_type text not null check (visit_type in ('hsv', 'rsv', 'tsv')),
  site_id uuid references public.sites (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  region_id uuid references public.regions (id) on delete set null,
  business_unit_id uuid references public.business_units (id) on delete set null,
  visit_date date not null default (timezone('utc', now()))::date,
  summary text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'allocated', 'closed', 'final_closed', 'cancelled')),
  assigned_to uuid references public.profiles (id),
  findings_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, visit_number)
);

create index if not exists site_visits_org_type_idx
  on public.site_visits (organization_id, visit_type);

-- ---------------------------------------------------------------------------
-- Enterprise action-level permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (code, module, action, description) values
  ('hazards.allocate', 'hazards', 'allocate', 'Allocate UA/UC to responsible person'),
  ('hazards.close_assigned', 'hazards', 'close_assigned', 'Assignee close UA/UC after corrective action'),
  ('hazards.final_close', 'hazards', 'final_close', 'Safety Officer final closure of UA/UC'),
  ('hazards.cancel', 'hazards', 'cancel', 'Cancel UA/UC report'),
  ('incidents.allocate', 'incidents', 'allocate', 'Allocate incident action'),
  ('incidents.final_close', 'incidents', 'final_close', 'Final closure of incident'),
  ('incidents.delete', 'incidents', 'delete', 'Delete incident report'),
  ('lmra.create', 'lmra', 'create', 'Create LMRA assessment'),
  ('lmra.view', 'lmra', 'view', 'View LMRA assessments'),
  ('lmra.approve', 'lmra', 'approve', 'Approve or reject LMRA'),
  ('visits.hsv.create', 'visits', 'hsv_create', 'Create Head Safety Visit'),
  ('visits.rsv.create', 'visits', 'rsv_create', 'Create Regional Safety Visit'),
  ('visits.tsv.create', 'visits', 'tsv_create', 'Create Team Safety Visit'),
  ('visits.view', 'visits', 'view', 'View site visits'),
  ('visits.allocate', 'visits', 'allocate', 'Allocate site visit actions'),
  ('visits.final_close', 'visits', 'final_close', 'Final close site visit'),
  ('mis.create', 'mis', 'create', 'Create MIS submission'),
  ('mis.edit', 'mis', 'edit', 'Edit MIS submission'),
  ('mis.delete', 'mis', 'delete', 'Delete MIS submission'),
  ('mis.approve', 'mis', 'approve', 'Approve MIS submission'),
  ('mis.view', 'mis', 'view', 'View MIS submissions'),
  ('score.create', 'score', 'create', 'Create EHS scorecard'),
  ('score.edit', 'score', 'edit', 'Edit EHS scorecard'),
  ('score.delete', 'score', 'delete', 'Delete EHS scorecard'),
  ('score.view', 'score', 'view', 'View EHS scorecard')
on conflict (code) do nothing;

-- Map permissions to system roles
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'ehs_officer' and r.is_system = true
  and p.code in (
    'hazards.allocate', 'hazards.close_assigned', 'hazards.final_close', 'hazards.cancel',
    'incidents.allocate', 'incidents.final_close',
    'lmra.create', 'lmra.view', 'lmra.approve',
    'visits.hsv.create', 'visits.rsv.create', 'visits.tsv.create', 'visits.view', 'visits.allocate', 'visits.final_close',
    'mis.create', 'mis.edit', 'mis.view',
    'score.create', 'score.edit', 'score.view'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'ehs_manager' and r.is_system = true
  and p.code in (
    'hazards.allocate', 'hazards.close_assigned', 'hazards.final_close', 'hazards.cancel',
    'incidents.allocate', 'incidents.final_close', 'incidents.delete',
    'lmra.create', 'lmra.view', 'lmra.approve',
    'visits.view', 'visits.allocate', 'visits.final_close',
    'mis.create', 'mis.edit', 'mis.delete', 'mis.approve', 'mis.view',
    'score.create', 'score.edit', 'score.delete', 'score.view'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'ehs_admin' and r.is_system = true
  and p.code like any (array['hazards.%', 'incidents.%', 'lmra.%', 'visits.%', 'mis.%', 'score.%'])
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'employee' and r.is_system = true
  and p.code in ('hazards.close_assigned', 'lmra.create', 'lmra.view', 'visits.tsv.create', 'visits.view', 'score.view', 'mis.view')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'supervisor' and r.is_system = true
  and p.code in ('hazards.close_assigned', 'lmra.create', 'lmra.view', 'visits.tsv.create', 'visits.view', 'score.view', 'mis.view')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'site_manager' and r.is_system = true
  and p.code in (
    'hazards.allocate', 'hazards.close_assigned', 'hazards.final_close',
    'lmra.create', 'lmra.view', 'lmra.approve',
    'visits.hsv.create', 'visits.view', 'visits.allocate', 'visits.final_close',
    'mis.view', 'score.view'
  )
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- RLS for new tables
-- ---------------------------------------------------------------------------
alter table public.regions enable row level security;
alter table public.lmra_assessments enable row level security;
alter table public.site_visits enable row level security;

create policy regions_select on public.regions
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));

create policy regions_mutate on public.regions
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );

create policy lmra_select on public.lmra_assessments
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));

create policy lmra_insert on public.lmra_assessments
  for insert with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'lmra.create')
  );

create policy lmra_update on public.lmra_assessments
  for update using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'lmra.approve')
    or (created_by = auth.uid() and status in ('draft', 'submitted'))
  )
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

create policy site_visits_select on public.site_visits
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));

create policy site_visits_insert on public.site_visits
  for insert with check (public.is_platform_admin() or public.is_org_member(organization_id));

create policy site_visits_update on public.site_visits
  for update using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

create trigger regions_updated_at before update on public.regions
  for each row execute function public.set_updated_at();
create trigger lmra_assessments_updated_at before update on public.lmra_assessments
  for each row execute function public.set_updated_at();
create trigger site_visits_updated_at before update on public.site_visits
  for each row execute function public.set_updated_at();
