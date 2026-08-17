-- Reporting process, notifications, self-host billing grace storage, permit renewals

alter table public.ehs_events
  add column if not exists force_closed boolean not null default false,
  add column if not exists force_close_reason text,
  add column if not exists force_closed_by uuid references public.profiles (id),
  add column if not exists force_closed_at timestamptz;

alter table public.capa_items
  add column if not exists closed_by uuid references public.profiles (id);

alter table public.permits
  add column if not exists parent_permit_id uuid references public.permits (id);

create table if not exists public.in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists in_app_notifications_user_idx
  on public.in_app_notifications (organization_id, user_id, created_at desc);

alter table public.in_app_notifications enable row level security;

drop policy if exists in_app_notifications_select on public.in_app_notifications;
create policy in_app_notifications_select on public.in_app_notifications
  for select using (
    user_id = auth.uid()
    or public.is_org_member(organization_id)
  );

drop policy if exists in_app_notifications_insert on public.in_app_notifications;
create policy in_app_notifications_insert on public.in_app_notifications
  for insert with check (public.is_org_member(organization_id));

drop policy if exists in_app_notifications_update on public.in_app_notifications;
create policy in_app_notifications_update on public.in_app_notifications
  for update using (user_id = auth.uid());

insert into public.platform_settings (key, value)
values ('billing_grace_days', to_jsonb(3))
on conflict (key) do nothing;
