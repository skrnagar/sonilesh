-- Phase 5: Risk Management Engine enrichment
-- Extends shared risk_assessments / JSA / JHA (not three CRUD stacks)

alter table public.risk_assessments
  add column if not exists business_unit_id uuid references public.business_units (id),
  add column if not exists source_event_id uuid references public.ehs_events (id) on delete set null,
  add column if not exists review_interval_days integer,
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists last_reviewed_by uuid references public.profiles (id),
  add column if not exists methodology text;

create index if not exists risk_assessments_source_event_idx
  on public.risk_assessments (source_event_id)
  where source_event_id is not null;

alter table public.risk_hazards
  add column if not exists task_step text,
  add column if not exists existing_controls_summary text,
  add column if not exists additional_controls_summary text,
  add column if not exists status text not null default 'open'
    check (status in ('open', 'controlled', 'accepted', 'closed'));

-- JSA/JHA ordered steps (optional structure under assessment)
create table if not exists public.risk_assessment_steps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assessment_id uuid not null references public.risk_assessments (id) on delete cascade,
  sort_order integer not null default 0,
  step_name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create index if not exists risk_assessment_steps_assessment_idx
  on public.risk_assessment_steps (assessment_id);

-- Immutable review / activity timeline
create table if not exists public.risk_assessment_activity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assessment_id uuid not null references public.risk_assessments (id) on delete cascade,
  actor_user_id uuid references public.profiles (id),
  activity_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists risk_assessment_activity_assessment_idx
  on public.risk_assessment_activity (assessment_id, created_at desc);

-- Risk register view helper: materialized as query; ensure columns for register filters
create index if not exists risk_hazards_org_residual_idx
  on public.risk_hazards (organization_id, residual_band)
  where deleted_at is null;

alter table public.risk_assessment_steps enable row level security;
alter table public.risk_assessment_activity enable row level security;

drop policy if exists risk_steps_tenant on public.risk_assessment_steps;
create policy risk_steps_tenant on public.risk_assessment_steps
  for all using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'risk.update')
    or public.has_org_permission(organization_id, 'risk.create')
  );

drop policy if exists risk_activity_select on public.risk_assessment_activity;
create policy risk_activity_select on public.risk_assessment_activity
  for select using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  );

drop policy if exists risk_activity_insert on public.risk_assessment_activity;
create policy risk_activity_insert on public.risk_assessment_activity
  for insert with check (
    public.is_platform_admin() or public.is_org_member(organization_id)
  );

-- Same-org site/project integrity for assessments
create or replace function public.assert_risk_assessment_same_org()
returns trigger
language plpgsql
as $$
declare
  ref_org uuid;
begin
  if new.site_id is not null then
    select organization_id into ref_org from public.sites where id = new.site_id;
    if ref_org is null or ref_org <> new.organization_id then
      raise exception 'site_id must belong to the same organization';
    end if;
  end if;
  if new.project_id is not null then
    select organization_id into ref_org from public.projects where id = new.project_id;
    if ref_org is null or ref_org <> new.organization_id then
      raise exception 'project_id must belong to the same organization';
    end if;
  end if;
  if new.source_event_id is not null then
    select organization_id into ref_org from public.ehs_events where id = new.source_event_id;
    if ref_org is null or ref_org <> new.organization_id then
      raise exception 'source_event_id must belong to the same organization';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists risk_assessments_same_org on public.risk_assessments;
create trigger risk_assessments_same_org
  before insert or update on public.risk_assessments
  for each row execute function public.assert_risk_assessment_same_org();

create trigger risk_assessment_steps_updated_at before update on public.risk_assessment_steps
  for each row execute function public.set_updated_at();
