-- EHS360: RLS helpers + policies

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_platform_admin from public.profiles p where p.id = auth.uid() and p.deleted_at is null),
    false
  );
$$;

create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.deleted_at is null
  );
$$;

create or replace function public.has_org_permission(
  p_organization_id uuid,
  p_permission_code text,
  p_site_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.is_platform_admin() then
    return true;
  end if;

  return exists (
    select 1
    from public.organization_members m
    join public.member_roles mr on mr.member_id = m.id and mr.deleted_at is null
    join public.role_permissions rp on rp.role_id = mr.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.deleted_at is null
      and p.code = p_permission_code
      and (
        mr.scope in ('organization', 'platform')
        or p_site_id is null
        or mr.site_id is null
        or mr.site_id = p_site_id
      )
  );
end;
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_settings enable row level security;
alter table public.organization_members enable row level security;
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.member_roles enable row level security;
alter table public.business_units enable row level security;
alter table public.sites enable row level security;
alter table public.projects enable row level security;
alter table public.departments enable row level security;
alter table public.locations enable row level security;
alter table public.features enable row level security;
alter table public.plans enable row level security;
alter table public.plan_features enable row level security;
alter table public.billing_accounts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_items enable row level security;
alter table public.organization_feature_overrides enable row level security;
alter table public.usage_metrics enable row level security;
alter table public.usage_events enable row level security;
alter table public.invoices enable row level security;
alter table public.subscription_events enable row level security;
alter table public.platform_settings enable row level security;
alter table public.support_tickets enable row level security;
alter table public.audit_logs enable row level security;
alter table public.number_sequences enable row level security;
alter table public.event_types enable row level security;
alter table public.event_categories enable row level security;
alter table public.severity_levels enable row level security;
alter table public.ehs_events enable row level security;
alter table public.ehs_event_people enable row level security;
alter table public.ehs_event_witnesses enable row level security;
alter table public.ehs_event_injuries enable row level security;
alter table public.ehs_event_comments enable row level security;
alter table public.ehs_event_attachments enable row level security;
alter table public.ehs_event_activity enable row level security;
alter table public.investigations enable row level security;
alter table public.capa_items enable row level security;

-- Profiles
create policy profiles_select_self_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_platform_admin());
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid() or public.is_platform_admin());

-- Organizations
create policy organizations_select on public.organizations
  for select using (public.is_platform_admin() or public.is_org_member(id));
create policy organizations_insert on public.organizations
  for insert with check (auth.uid() is not null);
create policy organizations_update on public.organizations
  for update using (
    public.is_platform_admin()
    or public.has_org_permission(id, 'settings.manage')
  );

-- Organization settings
create policy organization_settings_select on public.organization_settings
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy organization_settings_mutate on public.organization_settings
  for all using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'settings.manage')
  );

-- Members
create policy organization_members_select on public.organization_members
  for select using (public.is_platform_admin() or public.is_org_member(organization_id) or user_id = auth.uid());
create policy organization_members_mutate on public.organization_members
  for all using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'users.manage')
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'users.manage')
    or (user_id = auth.uid())
  );

-- Permissions & roles (readable by members; mutable by admins)
create policy permissions_select on public.permissions for select using (auth.uid() is not null);
create policy roles_select on public.roles
  for select using (
    organization_id is null
    or public.is_platform_admin()
    or public.is_org_member(organization_id)
  );
create policy role_permissions_select on public.role_permissions for select using (auth.uid() is not null);
create policy member_roles_select on public.member_roles
  for select using (
    public.is_platform_admin()
    or exists (
      select 1 from public.organization_members m
      where m.id = member_id and (public.is_org_member(m.organization_id) or m.user_id = auth.uid())
    )
  );
create policy member_roles_mutate on public.member_roles
  for all using (
    public.is_platform_admin()
    or exists (
      select 1 from public.organization_members m
      where m.id = member_id and public.has_org_permission(m.organization_id, 'users.manage')
    )
  )
  with check (
    public.is_platform_admin()
    or exists (
      select 1 from public.organization_members m
      where m.id = member_id and public.has_org_permission(m.organization_id, 'users.manage')
    )
  );

-- Org structure tables
create policy business_units_tenant on public.business_units
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy sites_tenant on public.sites
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy projects_tenant on public.projects
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy departments_tenant on public.departments
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy locations_tenant on public.locations
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

-- Plans/features catalog
create policy features_select on public.features for select using (auth.uid() is not null);
create policy plans_select on public.plans for select using (auth.uid() is not null or is_public = true);
create policy plan_features_select on public.plan_features for select using (auth.uid() is not null);
create policy features_admin on public.features for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy plans_admin on public.plans for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy plan_features_admin on public.plan_features for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Subscription domain
create policy billing_accounts_tenant on public.billing_accounts
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.has_org_permission(organization_id, 'billing.view') or public.is_platform_admin());
create policy subscriptions_select on public.subscriptions
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy subscriptions_admin on public.subscriptions
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy subscription_items_select on public.subscription_items
  for select using (
    public.is_platform_admin()
    or exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and public.is_org_member(s.organization_id)
    )
  );
create policy organization_feature_overrides_select on public.organization_feature_overrides
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy organization_feature_overrides_admin on public.organization_feature_overrides
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy usage_metrics_tenant on public.usage_metrics
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy usage_events_tenant on public.usage_events
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy invoices_tenant on public.invoices
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy subscription_events_tenant on public.subscription_events
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));

-- Platform
create policy platform_settings_admin on public.platform_settings
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy support_tickets_access on public.support_tickets
  for all using (
    public.is_platform_admin()
    or created_by = auth.uid()
    or (organization_id is not null and public.is_org_member(organization_id))
  )
  with check (
    public.is_platform_admin()
    or created_by = auth.uid()
    or (organization_id is not null and public.is_org_member(organization_id))
  );
create policy audit_logs_select on public.audit_logs
  for select using (
    public.is_platform_admin()
    or (organization_id is not null and public.has_org_permission(organization_id, 'audit.view'))
  );
create policy audit_logs_insert on public.audit_logs
  for insert with check (auth.uid() is not null);

-- EHS events domain
create policy event_types_select on public.event_types
  for select using (organization_id is null or public.is_org_member(organization_id) or public.is_platform_admin());
create policy event_categories_tenant on public.event_categories
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy severity_levels_select on public.severity_levels
  for select using (organization_id is null or public.is_org_member(organization_id) or public.is_platform_admin());
create policy number_sequences_tenant on public.number_sequences
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

create policy ehs_events_select on public.ehs_events
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy ehs_events_insert on public.ehs_events
  for insert with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'incidents.create')
    or public.has_org_permission(organization_id, 'near_miss.create')
    or public.has_org_permission(organization_id, 'hazards.create')
  );
create policy ehs_events_update on public.ehs_events
  for update using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'incidents.update', site_id)
    or public.has_org_permission(organization_id, 'near_miss.update', site_id)
    or public.has_org_permission(organization_id, 'hazards.update', site_id)
    or reporter_id = auth.uid()
  );

create policy ehs_event_people_tenant on public.ehs_event_people
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy ehs_event_witnesses_tenant on public.ehs_event_witnesses
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy ehs_event_injuries_tenant on public.ehs_event_injuries
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy ehs_event_comments_tenant on public.ehs_event_comments
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy ehs_event_attachments_tenant on public.ehs_event_attachments
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy ehs_event_activity_tenant on public.ehs_event_activity
  for select using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy ehs_event_activity_insert on public.ehs_event_activity
  for insert with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy investigations_tenant on public.investigations
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
create policy capa_items_tenant on public.capa_items
  for all using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
