-- Foundation: canonical notifications, preferences, generic attachments, Approver role

do $$
begin
  if to_regclass('public.in_app_notifications') is not null
     and to_regclass('public.notifications') is null then
    alter table public.in_app_notifications rename to notifications;
  end if;
end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.notifications enable row level security;

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select using (user_id = auth.uid() or public.is_org_member(organization_id));

drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications
  for insert with check (public.is_org_member(organization_id));

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update using (user_id = auth.uid());

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'sms', 'push')),
  event_key text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, user_id, channel, event_key)
);

alter table public.notification_preferences enable row level security;

drop policy if exists notification_preferences_self on public.notification_preferences;
create policy notification_preferences_self on public.notification_preferences
  for all using (user_id = auth.uid() and public.is_org_member(organization_id))
  with check (user_id = auth.uid() and public.is_org_member(organization_id));

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size integer,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

alter table public.attachments enable row level security;

drop policy if exists attachments_tenant on public.attachments;
create policy attachments_tenant on public.attachments
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

insert into public.roles (organization_id, code, name, description, is_system, is_default)
select null, 'approver', 'Approver', 'Named approver for permits, CAPA verification, and closures', true, false
where not exists (
  select 1 from public.roles where organization_id is null and code = 'approver'
);

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code = 'approver'
  and p.code in (
    'dashboard.view','incidents.view','incidents.approve','near_miss.view','hazards.view',
    'capa.view','capa.verify','audit.view'
  )
on conflict do nothing;
