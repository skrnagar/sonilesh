-- Phase 16A: Notifications reliability fix
-- 1. Tighten SELECT policy: recipients see only their own rows (and are org members).
-- 2. Keep INSERT open to any org member (actor inserts rows for recipients).
-- 3. Add table-level GRANT so authenticated role can insert without service_role.
-- 4. Add a targeted index to speed up the unread count queries used in the bell badge.

-- Idempotent policy replacement on notifications table.
-- The table was created by migration 19/28 under the name 'notifications'.

do $$
begin
  if to_regclass('public.notifications') is null then
    raise notice 'notifications table not found — skipping policy update';
    return;
  end if;
end $$;

-- SELECT: only the recipient in their own org.
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select
  using (
    user_id = auth.uid()
    and public.is_org_member(organization_id)
  );

-- INSERT: any active org member can insert (actor notifies recipient).
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications
  for insert
  with check (public.is_org_member(organization_id));

-- UPDATE: only the recipient can mark their own notifications read.
drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update
  using (
    user_id = auth.uid()
    and public.is_org_member(organization_id)
  )
  with check (
    user_id = auth.uid()
    and public.is_org_member(organization_id)
  );

-- DELETE: not allowed via API (soft-delete via read_at / TTL only).
drop policy if exists notifications_delete on public.notifications;

-- Ensure authenticated role has the table permissions PostgREST needs.
-- service_role always bypasses RLS; authenticated needs explicit grants.
grant select, insert, update on public.notifications to authenticated;
grant select, insert, update on public.notifications to service_role;

-- Composite index used by listNotificationsForUser and countUnreadNotifications.
create index if not exists notifications_recipient_idx
  on public.notifications (organization_id, user_id, created_at desc);

-- Partial index used for the unread count badge — avoids a full table scan.
create index if not exists notifications_unread_badge_idx
  on public.notifications (organization_id, user_id)
  where read_at is null;

-- Notification preferences: same treatment.
do $$
begin
  if to_regclass('public.notification_preferences') is null then
    raise notice 'notification_preferences table not found — skipping';
    return;
  end if;
end $$;

grant select, insert, update, delete on public.notification_preferences to authenticated;
grant select, insert, update, delete on public.notification_preferences to service_role;
