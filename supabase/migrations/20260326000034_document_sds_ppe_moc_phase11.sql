-- Phase 11: Document control + SDS + PPE + Management of Change
-- Extends 00013 tables. Files stay in private bucket ehs-attachments + public.attachments.
-- Numbered 00034 because 00032 is contractors and 00033 is owned by another phase.
-- Does not add per-module storage, invent SDS extraction, or start Phase 12 stacks.

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (code, module, action, description) values
  ('documents.create', 'documents', 'create', 'Create controlled documents'),
  ('documents.update', 'documents', 'update', 'Update controlled documents'),
  ('documents.approve', 'documents', 'approve', 'Approve document versions'),
  ('documents.acknowledge', 'documents', 'acknowledge', 'Acknowledge controlled documents'),
  ('documents.configure', 'documents', 'configure', 'Configure document types and classifications'),
  ('ppe.issue', 'ppe', 'issue', 'Issue PPE to workers'),
  ('ppe.inspect', 'ppe', 'inspect', 'Inspect PPE via checklist engine'),
  ('ppe.return', 'ppe', 'return', 'Return or replace issued PPE'),
  ('moc.create', 'moc', 'create', 'Create MOC requests'),
  ('moc.approve', 'moc', 'approve', 'Approve MOC requests'),
  ('moc.implement', 'moc', 'implement', 'Mark MOC implementation'),
  ('moc.verify', 'moc', 'verify', 'Verify MOC post-change')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code in ('tenant_admin', 'ehs_manager', 'ehs_officer')
  and p.code in (
    'documents.create','documents.update','documents.approve','documents.acknowledge','documents.configure',
    'ppe.issue','ppe.inspect','ppe.return',
    'moc.create','moc.approve','moc.implement','moc.verify'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code = 'supervisor'
  and p.code in (
    'documents.view','documents.acknowledge','documents.create',
    'ppe.view','ppe.issue','ppe.inspect','ppe.return',
    'chemicals.view','moc.view','moc.create'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code in ('employee', 'contractor')
  and p.code in ('documents.view','documents.acknowledge','chemicals.view','ppe.view','moc.view')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code = 'approver'
  and p.code in ('documents.view','documents.approve','moc.view','moc.approve')
on conflict do nothing;

alter table public.organization_settings
  add column if not exists expiry_warning_days integer not null default 30;

do $$ begin
  alter table public.organization_settings
    add constraint organization_settings_expiry_warning_days_check
    check (expiry_warning_days between 1 and 365);
exception when duplicate_object then null;
end $$;

create table if not exists public.document_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  is_active boolean not null default true,
  requires_acknowledgement boolean not null default false,
  review_interval_days integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, code)
);

create table if not exists public.document_classifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, code)
);

alter table public.controlled_documents
  add column if not exists document_type_id uuid references public.document_types (id),
  add column if not exists classification_id uuid references public.document_classifications (id),
  add column if not exists tags text[] not null default '{}',
  add column if not exists owner_id uuid references public.profiles (id),
  add column if not exists site_id uuid references public.sites (id),
  add column if not exists department_id uuid references public.departments (id),
  add column if not exists current_version_id uuid,
  add column if not exists acknowledgement_required boolean not null default false,
  add column if not exists review_due_on date,
  add column if not exists published_at timestamptz,
  add column if not exists notes text;

alter table public.controlled_documents drop constraint if exists controlled_documents_status_check;
alter table public.controlled_documents
  add constraint controlled_documents_status_check
  check (status in (
    'draft', 'in_review', 'approved', 'published', 'distributed', 'expired', 'obsolete'
  ));

alter table public.document_versions
  add column if not exists storage_path text,
  add column if not exists file_name text,
  add column if not exists mime_type text,
  add column if not exists file_size integer,
  add column if not exists attachment_id uuid references public.attachments (id) on delete set null,
  add column if not exists status text not null default 'draft',
  add column if not exists change_summary text,
  add column if not exists created_by uuid references public.profiles (id),
  add column if not exists published_at timestamptz,
  add column if not exists is_current boolean not null default false;

alter table public.document_versions drop constraint if exists document_versions_status_check;
alter table public.document_versions
  add constraint document_versions_status_check
  check (status in ('draft', 'in_review', 'approved', 'published', 'superseded'));

do $$ begin
  alter table public.controlled_documents
    add constraint controlled_documents_current_version_fk
    foreign key (current_version_id) references public.document_versions (id);
exception when duplicate_object then null;
end $$;

alter table public.document_acknowledgements
  add column if not exists version_id uuid references public.document_versions (id) on delete cascade;

alter table public.document_acknowledgements
  drop constraint if exists document_acknowledgements_document_id_user_id_key;

create unique index if not exists document_acknowledgements_doc_user_version_uidx
  on public.document_acknowledgements (
    document_id,
    user_id,
    coalesce(version_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create table if not exists public.document_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id uuid not null references public.controlled_documents (id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  unique (document_id, source_type, source_id)
);

create table if not exists public.document_distribution (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id uuid not null references public.controlled_documents (id) on delete cascade,
  version_id uuid references public.document_versions (id) on delete cascade,
  audience_type text not null check (audience_type in ('org', 'role', 'site', 'user')),
  audience_key text not null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.document_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id uuid not null references public.controlled_documents (id) on delete cascade,
  version_id uuid not null references public.document_versions (id) on delete cascade,
  approver_id uuid not null references public.profiles (id),
  decision text not null check (decision in ('approved', 'rejected')),
  comments text,
  decided_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.document_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id uuid not null references public.controlled_documents (id) on delete cascade,
  version_id uuid references public.document_versions (id) on delete set null,
  reviewer_id uuid references public.profiles (id),
  due_on date,
  completed_at timestamptz,
  outcome text check (outcome in ('current', 'revise', 'obsolete')),
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.chemicals
  add column if not exists un_number text,
  add column if not exists manufacturer text,
  add column if not exists product_code text,
  add column if not exists signal_word text,
  add column if not exists site_id uuid references public.sites (id),
  add column if not exists status text not null default 'active',
  add column if not exists inventory_qty numeric(12,2) not null default 0,
  add column if not exists inventory_unit text not null default 'L';

alter table public.chemicals drop constraint if exists chemicals_status_check;
alter table public.chemicals
  add constraint chemicals_status_check
  check (status in ('active', 'inactive', 'archived'));

alter table public.chemical_sds
  add column if not exists storage_path text,
  add column if not exists file_name text,
  add column if not exists mime_type text,
  add column if not exists file_size integer,
  add column if not exists attachment_id uuid references public.attachments (id) on delete set null,
  add column if not exists expires_on date,
  add column if not exists uploaded_by uuid references public.profiles (id),
  add column if not exists superseded_at timestamptz,
  add column if not exists notes text;

create table if not exists public.chemical_inventory (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  chemical_id uuid not null references public.chemicals (id) on delete cascade,
  location_id uuid not null references public.locations (id),
  quantity numeric(12,2) not null default 0,
  unit text not null default 'L',
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles (id),
  unique (chemical_id, location_id)
);

alter table public.ppe_categories
  add column if not exists is_example boolean not null default false,
  add column if not exists inspection_interval_days integer,
  add column if not exists is_active boolean not null default true;

alter table public.ppe_items
  add column if not exists site_id uuid references public.sites (id),
  add column if not exists size_label text,
  add column if not exists manufacturer text,
  add column if not exists inspection_interval_days integer,
  add column if not exists min_stock integer not null default 0,
  add column if not exists status text not null default 'active',
  add column if not exists notes text;

alter table public.ppe_items drop constraint if exists ppe_items_status_check;
alter table public.ppe_items
  add constraint ppe_items_status_check
  check (status in ('active', 'inactive', 'retired'));

alter table public.ppe_issuances
  add column if not exists issued_by uuid references public.profiles (id),
  add column if not exists returned_at timestamptz,
  add column if not exists return_notes text,
  add column if not exists site_id uuid references public.sites (id),
  add column if not exists quantity integer not null default 1,
  add column if not exists notes text;

alter table public.ppe_issuances drop constraint if exists ppe_issuances_status_check;
alter table public.ppe_issuances
  add constraint ppe_issuances_status_check
  check (status in ('issued', 'returned', 'replaced', 'expired'));

alter table public.checklist_templates drop constraint if exists checklist_templates_checklist_type_check;
alter table public.checklist_templates
  add constraint checklist_templates_checklist_type_check
  check (checklist_type in (
    'inspection', 'audit', 'equipment', 'vehicle', 'behavioral',
    'contractor', 'training', 'compliance', 'environmental', 'general', 'permit', 'ppe'
  ));

alter table public.checklist_assignments drop constraint if exists checklist_assignments_checklist_type_check;
alter table public.checklist_assignments
  add constraint checklist_assignments_checklist_type_check
  check (checklist_type in (
    'inspection', 'audit', 'equipment', 'vehicle', 'behavioral',
    'contractor', 'training', 'compliance', 'environmental', 'general', 'permit', 'ppe'
  ));

alter table public.checklist_assignments
  add column if not exists source_module text,
  add column if not exists source_record_id uuid;

create table if not exists public.ppe_inspections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  item_id uuid not null references public.ppe_items (id) on delete cascade,
  issuance_id uuid references public.ppe_issuances (id) on delete set null,
  assignment_id uuid references public.checklist_assignments (id) on delete set null,
  inspected_at timestamptz not null default timezone('utc', now()),
  inspector_id uuid references public.profiles (id),
  result text not null default 'pending'
    check (result in ('pending', 'pass', 'fail', 'replaced')),
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.moc_requests
  add column if not exists change_type text,
  add column if not exists impact_summary text,
  add column if not exists impact_areas jsonb not null default '[]'::jsonb,
  add column if not exists current_state text,
  add column if not exists proposed_state text,
  add column if not exists training_required boolean not null default false,
  add column if not exists training_course_id uuid references public.training_courses (id),
  add column if not exists implementation_notes text,
  add column if not exists verification_notes text,
  add column if not exists verified_by uuid references public.profiles (id),
  add column if not exists cancelled_reason text,
  add column if not exists owner_id uuid references public.profiles (id);

create table if not exists public.moc_impacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  moc_id uuid not null references public.moc_requests (id) on delete cascade,
  area text not null,
  description text,
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.moc_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  moc_id uuid not null references public.moc_requests (id) on delete cascade,
  approver_id uuid not null references public.profiles (id),
  role_label text,
  decision text not null check (decision in ('approved', 'rejected')),
  comments text,
  decided_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.moc_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  moc_id uuid not null references public.moc_requests (id) on delete cascade,
  actor_user_id uuid references public.profiles (id),
  event_type text not null,
  from_status text,
  to_status text,
  message text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.capa_items drop constraint if exists capa_items_source_module_check;
alter table public.capa_items
  add constraint capa_items_source_module_check
  check (source_module in (
    'incident', 'near_miss', 'hazard', 'unsafe_act', 'unsafe_condition',
    'safety_observation', 'ehs_report', 'risk_assessment', 'inspection',
    'audit', 'permit', 'training', 'contractor', 'other', 'action_item', 'moc', 'compliance'
  ));

create index if not exists document_types_org_idx on public.document_types (organization_id, is_active);
create index if not exists document_classifications_org_idx on public.document_classifications (organization_id, is_active);
create index if not exists controlled_documents_org_status_idx on public.controlled_documents (organization_id, status) where deleted_at is null;
create index if not exists controlled_documents_review_idx on public.controlled_documents (organization_id, review_due_on) where deleted_at is null;
create index if not exists document_versions_doc_idx on public.document_versions (organization_id, document_id, status);
create index if not exists document_links_source_idx on public.document_links (organization_id, source_type, source_id);
create index if not exists document_links_doc_idx on public.document_links (organization_id, document_id);
create index if not exists chemical_sds_current_idx on public.chemical_sds (organization_id, chemical_id) where is_current = true;
create index if not exists chemical_inventory_chem_idx on public.chemical_inventory (organization_id, chemical_id);
create index if not exists ppe_items_org_site_idx on public.ppe_items (organization_id, site_id) where deleted_at is null;
create index if not exists ppe_issuances_user_idx on public.ppe_issuances (organization_id, user_id, status);
create index if not exists ppe_inspections_item_idx on public.ppe_inspections (organization_id, item_id);
create index if not exists moc_requests_org_status_idx on public.moc_requests (organization_id, status) where deleted_at is null;
create index if not exists moc_history_moc_idx on public.moc_history (organization_id, moc_id, created_at desc);
create index if not exists attachments_entity_idx on public.attachments (organization_id, entity_type, entity_id) where deleted_at is null;

create or replace function public.assert_document_version_immutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.status in ('published', 'superseded') then
      raise exception 'cannot delete a historical published version';
    end if;
    return old;
  end if;

  if old.status in ('published', 'superseded') then
    if new.status is distinct from old.status and old.status = 'published' and new.status = 'superseded' then
      return new;
    end if;
    if new.is_current is distinct from old.is_current and new.status = old.status then
      return new;
    end if;
    if new.storage_path is distinct from old.storage_path
       or new.file_url is distinct from old.file_url
       or new.file_name is distinct from old.file_name
       or new.version is distinct from old.version
       or new.attachment_id is distinct from old.attachment_id
       or new.change_summary is distinct from old.change_summary then
      raise exception 'cannot modify a historical published version';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists document_versions_immutable on public.document_versions;
create trigger document_versions_immutable
  before update or delete on public.document_versions
  for each row execute function public.assert_document_version_immutable();

create or replace function public.assert_moc_same_org()
returns trigger
language plpgsql
set search_path = public
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
  if new.risk_assessment_id is not null then
    select organization_id into ref_org from public.risk_assessments where id = new.risk_assessment_id;
    if ref_org is null or ref_org <> new.organization_id then
      raise exception 'Cannot link a risk assessment from another organization';
    end if;
  end if;
  if new.training_course_id is not null then
    select organization_id into ref_org from public.training_courses where id = new.training_course_id;
    if ref_org is null or ref_org <> new.organization_id then
      raise exception 'training_course_id must belong to the same organization';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists moc_requests_same_org on public.moc_requests;
create trigger moc_requests_same_org
  before insert or update on public.moc_requests
  for each row execute function public.assert_moc_same_org();

create or replace function public.assert_document_link_same_org()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  ref_org uuid;
begin
  select organization_id into ref_org from public.controlled_documents where id = new.document_id;
  if ref_org is null or ref_org <> new.organization_id then
    raise exception 'document_id must belong to the same organization';
  end if;
  return new;
end;
$$;

drop trigger if exists document_links_same_org on public.document_links;
create trigger document_links_same_org
  before insert or update on public.document_links
  for each row execute function public.assert_document_link_same_org();

create or replace function public.assert_ppe_item_same_org()
returns trigger
language plpgsql
set search_path = public
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
  return new;
end;
$$;

drop trigger if exists ppe_items_same_org on public.ppe_items;
create trigger ppe_items_same_org
  before insert or update on public.ppe_items
  for each row execute function public.assert_ppe_item_same_org();

create or replace function public.assert_chemical_sds_same_org()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  ref_org uuid;
begin
  select organization_id into ref_org from public.chemicals where id = new.chemical_id;
  if ref_org is null or ref_org <> new.organization_id then
    raise exception 'chemical_id must belong to the same organization';
  end if;
  return new;
end;
$$;

drop trigger if exists chemical_sds_same_org on public.chemical_sds;
create trigger chemical_sds_same_org
  before insert or update on public.chemical_sds
  for each row execute function public.assert_chemical_sds_same_org();

drop trigger if exists chemical_inventory_updated_at on public.chemical_inventory;
create trigger chemical_inventory_updated_at before update on public.chemical_inventory
  for each row execute function public.set_updated_at();

do $$
declare
  t text;
begin
  foreach t in array array[
    'document_types','document_classifications','document_links','document_distribution',
    'document_approvals','document_reviews','chemical_inventory','ppe_inspections',
    'moc_impacts','moc_approvals','moc_history'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format(
      'create policy %I on public.%I for select using (public.is_platform_admin() or public.is_org_member(organization_id))',
      t || '_select', t
    );
    execute format(
      'create policy %I on public.%I for insert with check (public.is_platform_admin() or public.is_org_member(organization_id))',
      t || '_insert', t
    );
    execute format(
      'create policy %I on public.%I for update using (public.is_platform_admin() or public.is_org_member(organization_id)) with check (public.is_platform_admin() or public.is_org_member(organization_id))',
      t || '_update', t
    );
    execute format(
      'create policy %I on public.%I for delete using (public.is_platform_admin() or public.is_org_member(organization_id))',
      t || '_delete', t
    );
  end loop;
end $$;
