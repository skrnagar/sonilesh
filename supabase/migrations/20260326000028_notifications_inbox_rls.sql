-- Notifications inbox: recipients only see their own rows; ensure table exists for partial migrates

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

create index if not exists notifications_user_unread_idx
  on public.notifications (organization_id, user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

-- Drop both legacy and current policy names so SELECT is recipient-only
drop policy if exists in_app_notifications_select on public.notifications;
drop policy if exists in_app_notifications_insert on public.notifications;
drop policy if exists in_app_notifications_update on public.notifications;
drop policy if exists notifications_select on public.notifications;
drop policy if exists notifications_insert on public.notifications;
drop policy if exists notifications_update on public.notifications;

create policy notifications_select on public.notifications
  for select using (
    user_id = auth.uid()
    and public.is_org_member(organization_id)
  );

create policy notifications_insert on public.notifications
  for insert with check (public.is_org_member(organization_id));

create policy notifications_update on public.notifications
  for update using (
    user_id = auth.uid()
    and public.is_org_member(organization_id)
  )
  with check (
    user_id = auth.uid()
    and public.is_org_member(organization_id)
  );
