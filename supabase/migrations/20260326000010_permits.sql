-- Phase 7: configurable Permit to Work engine

create table public.permit_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  default_validity_hours integer not null default 8,
  requires_risk_assessment boolean not null default true,
  is_system boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, code)
);

create unique index permit_types_system_code_uidx
  on public.permit_types (code)
  where organization_id is null;

create table public.permits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_type_id uuid not null references public.permit_types (id),
  permit_number text not null,
  status text not null default 'requested'
    check (status in (
      'requested', 'risk_check', 'pre_work_checklist', 'authorization',
      'active', 'extension_pending', 'closeout', 'closed', 'cancelled', 'expired'
    )),
  title text not null,
  work_description text not null default '',
  site_id uuid references public.sites (id),
  project_id uuid references public.projects (id),
  location_id uuid references public.locations (id),
  requester_id uuid references public.profiles (id),
  issuer_id uuid references public.profiles (id),
  area_owner_id uuid references public.profiles (id),
  risk_assessment_id uuid references public.risk_assessments (id),
  valid_from timestamptz,
  valid_to timestamptz,
  isolation_loto_required boolean not null default false,
  isolation_details text,
  closeout_notes text,
  closed_at timestamptz,
  closed_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, permit_number)
);

create table public.permit_checklist_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_id uuid not null references public.permits (id) on delete cascade,
  item_text text not null,
  is_required boolean not null default true,
  is_checked boolean not null default false,
  checked_by uuid references public.profiles (id),
  checked_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.permit_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_id uuid not null references public.permits (id) on delete cascade,
  approver_role text not null,
  approver_id uuid references public.profiles (id),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  signature_name text,
  signed_at timestamptz,
  comments text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.permit_extensions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_id uuid not null references public.permits (id) on delete cascade,
  previous_valid_to timestamptz not null,
  new_valid_to timestamptz not null,
  reason text not null,
  requested_by uuid references public.profiles (id),
  approved_by uuid references public.profiles (id),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.permit_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permit_id uuid not null references public.permits (id) on delete cascade,
  file_name text not null,
  file_url text not null,
  content_type text,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

create index permits_org_status_idx on public.permits (organization_id, status);
create index permits_valid_to_idx on public.permits (organization_id, valid_to);

insert into public.permit_types (organization_id, code, name, description, is_system, sort_order)
values
  (null, 'hot_work', 'Hot Work', 'Welding, cutting, grinding', true, 1),
  (null, 'confined_space', 'Confined Space', 'Entry into confined spaces', true, 2),
  (null, 'work_at_height', 'Work at Height', 'Elevated work', true, 3),
  (null, 'excavation', 'Excavation', 'Digging and trenching', true, 4),
  (null, 'electrical', 'Electrical', 'Electrical work', true, 5),
  (null, 'lifting', 'Lifting', 'Lifting operations', true, 6),
  (null, 'loto', 'LOTO', 'Lockout / tagout', true, 7),
  (null, 'general_work', 'General Work', 'General permit to work', true, 8)
on conflict do nothing;

-- Expire active permits past valid_to (callable by cron / app)
create or replace function public.expire_overdue_permits()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.permits
  set status = 'expired', updated_at = timezone('utc', now())
  where status = 'active'
    and valid_to is not null
    and valid_to < timezone('utc', now())
    and deleted_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create trigger permit_types_updated_at before update on public.permit_types
  for each row execute function public.set_updated_at();
create trigger permits_updated_at before update on public.permits
  for each row execute function public.set_updated_at();
