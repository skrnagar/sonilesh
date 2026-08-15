-- Phase 6: configurable risk assessment engine (Risk / JSA / JHA)

create table public.risk_assessment_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, code)
);

create unique index risk_assessment_types_system_code_uidx
  on public.risk_assessment_types (code)
  where organization_id is null;

create table public.risk_matrices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null default 'Default 5x5',
  likelihood_max integer not null default 5 check (likelihood_max between 2 and 10),
  consequence_max integer not null default 5 check (consequence_max between 2 and 10),
  -- bands: [{code,name,min_score,max_score,color}] — never hard-coded in app logic
  bands jsonb not null default '[
    {"code":"low","name":"Low","min_score":1,"max_score":4,"color":"#22c55e"},
    {"code":"medium","name":"Medium","min_score":5,"max_score":9,"color":"#eab308"},
    {"code":"high","name":"High","min_score":10,"max_score":14,"color":"#f97316"},
    {"code":"critical","name":"Critical","min_score":15,"max_score":25,"color":"#ef4444"}
  ]'::jsonb,
  likelihood_labels jsonb not null default '["Rare","Unlikely","Possible","Likely","Almost Certain"]'::jsonb,
  consequence_labels jsonb not null default '["Insignificant","Minor","Moderate","Major","Catastrophic"]'::jsonb,
  is_default boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assessment_type_id uuid not null references public.risk_assessment_types (id),
  matrix_id uuid references public.risk_matrices (id),
  assessment_number text not null,
  title text not null,
  task_activity text,
  site_id uuid references public.sites (id),
  project_id uuid references public.projects (id),
  location_id uuid references public.locations (id),
  department_id uuid references public.departments (id),
  status text not null default 'draft'
    check (status in (
      'draft', 'team_assigned', 'in_progress', 'review', 'approval',
      'active', 'periodic_review', 'retired', 'cancelled'
    )),
  assessment_date date not null default (timezone('utc', now()))::date,
  next_review_date date,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  owner_id uuid references public.profiles (id),
  inherent_risk_score integer,
  inherent_risk_band text,
  residual_risk_score integer,
  residual_risk_band text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, assessment_number)
);

create table public.risk_assessment_team (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assessment_id uuid not null references public.risk_assessments (id) on delete cascade,
  user_id uuid references public.profiles (id),
  member_name text,
  role_label text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.risk_hazards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assessment_id uuid not null references public.risk_assessments (id) on delete cascade,
  hazard_description text not null,
  persons_at_risk text,
  sort_order integer not null default 0,
  inherent_likelihood integer check (inherent_likelihood between 1 and 10),
  inherent_consequence integer check (inherent_consequence between 1 and 10),
  inherent_score integer,
  inherent_band text,
  residual_likelihood integer check (residual_likelihood between 1 and 10),
  residual_consequence integer check (residual_consequence between 1 and 10),
  residual_score integer,
  residual_band text,
  owner_id uuid references public.profiles (id),
  target_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.risk_controls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  hazard_id uuid not null references public.risk_hazards (id) on delete cascade,
  control_type text not null
    check (control_type in ('existing', 'additional')),
  hierarchy text not null
    check (hierarchy in ('elimination', 'substitution', 'engineering', 'administrative', 'ppe')),
  description text not null,
  owner_id uuid references public.profiles (id),
  target_date date,
  capa_id uuid references public.capa_items (id) on delete set null,
  is_implemented boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create index risk_assessments_org_status_idx on public.risk_assessments (organization_id, status);
create index risk_hazards_assessment_idx on public.risk_hazards (assessment_id);
create index risk_controls_hazard_idx on public.risk_controls (hazard_id);

insert into public.risk_assessment_types (organization_id, code, name, description, is_system)
values
  (null, 'risk_assessment', 'Risk Assessment', 'General task/area risk assessment', true),
  (null, 'jsa', 'Job Safety Analysis', 'Job safety analysis', true),
  (null, 'jha', 'Job Hazard Analysis', 'Job hazard analysis', true)
on conflict do nothing;

create or replace function public.resolve_risk_band(
  p_matrix_id uuid,
  p_score integer
)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_band text;
begin
  if p_score is null or p_matrix_id is null then
    return null;
  end if;
  select b->>'code' into v_band
  from public.risk_matrices m
  cross join lateral jsonb_array_elements(m.bands) b
  where m.id = p_matrix_id
    and p_score between (b->>'min_score')::int and (b->>'max_score')::int
  order by (b->>'min_score')::int
  limit 1;
  return v_band;
end;
$$;

create trigger risk_assessment_types_updated_at before update on public.risk_assessment_types
  for each row execute function public.set_updated_at();
create trigger risk_matrices_updated_at before update on public.risk_matrices
  for each row execute function public.set_updated_at();
create trigger risk_assessments_updated_at before update on public.risk_assessments
  for each row execute function public.set_updated_at();
create trigger risk_hazards_updated_at before update on public.risk_hazards
  for each row execute function public.set_updated_at();
create trigger risk_controls_updated_at before update on public.risk_controls
  for each row execute function public.set_updated_at();
