-- Production hardening: webhook idempotency + tighten definer EXECUTE grants.
-- Does not drop tables or rewrite history.

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  organization_id uuid references public.organizations(id) on delete set null,
  event_type text,
  processed_at timestamptz not null default timezone('utc', now()),
  unique (provider, provider_event_id)
);

create index if not exists billing_webhook_events_org_idx
  on public.billing_webhook_events (organization_id, processed_at desc);

alter table public.billing_webhook_events enable row level security;

drop policy if exists billing_webhook_events_admin_select on public.billing_webhook_events;
create policy billing_webhook_events_admin_select
  on public.billing_webhook_events
  for select
  to authenticated
  using (public.is_platform_admin());

revoke all on table public.billing_webhook_events from anon, authenticated;
grant select on table public.billing_webhook_events to authenticated;

-- Trigger-only function must not be callable via PostgREST as anon.
revoke execute on function public.prevent_contractor_doc_self_verify() from anon, public;
