-- Performance: dashboard KPI counts filter heavily by event_type_id under an org.
create index if not exists ehs_events_org_type_idx
  on public.ehs_events (organization_id, event_type_id)
  where deleted_at is null;

create index if not exists capa_items_org_due_idx
  on public.capa_items (organization_id, due_date)
  where deleted_at is null;
