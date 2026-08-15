-- Phase 9: central CAPA enhancements (shared platform service)

alter table public.capa_items
  add column if not exists verification_required boolean not null default true;

alter table public.capa_items
  add column if not exists evidence text;

alter table public.capa_items
  add column if not exists rework_count integer not null default 0;

alter table public.capa_items
  add column if not exists escalated_at timestamptz;

alter table public.capa_items
  add column if not exists last_reminder_at timestamptz;

alter table public.capa_items
  drop constraint if exists capa_items_source_module_check;

alter table public.capa_items
  add constraint capa_items_source_module_check
  check (source_module in (
    'incident', 'near_miss', 'hazard', 'risk_assessment', 'inspection',
    'audit', 'permit', 'training', 'contractor', 'other', 'action_item'
  ));

-- Overdue is derived (due_date < today AND status not terminal)
create or replace function public.capa_is_overdue(p_status text, p_due_date date)
returns boolean
language sql
immutable
as $$
  select p_due_date is not null
    and p_due_date < (timezone('utc', now()))::date
    and p_status not in ('verified', 'closed', 'cancelled');
$$;

create table if not exists public.capa_activity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  capa_id uuid not null references public.capa_items (id) on delete cascade,
  action text not null,
  from_status text,
  to_status text,
  notes text,
  actor_id uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists capa_activity_capa_idx on public.capa_activity (capa_id, created_at desc);

-- BR-001 style gate: source cannot close while required open CAPA remain
create or replace function public.has_blocking_capa(
  p_organization_id uuid,
  p_source_module text,
  p_source_record_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.capa_items c
    where c.organization_id = p_organization_id
      and c.source_module = p_source_module
      and c.source_record_id = p_source_record_id
      and c.is_required = true
      and c.status not in ('verified', 'closed', 'cancelled')
      and c.deleted_at is null
  );
$$;
