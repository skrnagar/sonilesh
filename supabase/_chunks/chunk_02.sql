-- EHS360 chunk 2 — paste into SQL Editor and Run
-- Project: sqybbygfksnjvmatiafm

-- >>> 20260326000006_rls_policies.sql
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


-- >>> 20260326000007_seed_data.sql
-- EHS360 seed: permissions, system roles, features, plans, event types, severities

insert into public.permissions (code, module, action, description) values
  ('platform.admin', 'platform', 'admin', 'Full SaaS platform administration'),
  ('settings.manage', 'settings', 'manage', 'Manage organization settings'),
  ('users.manage', 'users', 'manage', 'Manage organization users and roles'),
  ('users.view', 'users', 'view', 'View organization users'),
  ('sites.manage', 'sites', 'manage', 'Manage sites and locations'),
  ('sites.view', 'sites', 'view', 'View sites'),
  ('billing.view', 'billing', 'view', 'View billing and subscription'),
  ('audit.view', 'audit', 'view', 'View audit trail'),
  ('dashboard.view', 'dashboard', 'view', 'View EHS dashboard'),
  ('incidents.create', 'incidents', 'create', 'Create incidents'),
  ('incidents.view', 'incidents', 'view', 'View incidents'),
  ('incidents.update', 'incidents', 'update', 'Update incidents'),
  ('incidents.investigate', 'incidents', 'investigate', 'Investigate incidents'),
  ('incidents.approve', 'incidents', 'approve', 'Approve/close incidents'),
  ('incidents.export', 'incidents', 'export', 'Export incidents'),
  ('near_miss.create', 'near_miss', 'create', 'Create near misses'),
  ('near_miss.view', 'near_miss', 'view', 'View near misses'),
  ('near_miss.update', 'near_miss', 'update', 'Update near misses'),
  ('hazards.create', 'hazards', 'create', 'Create hazards/UA/UC'),
  ('hazards.view', 'hazards', 'view', 'View hazards/UA/UC'),
  ('hazards.update', 'hazards', 'update', 'Update hazards/UA/UC'),
  ('capa.create', 'capa', 'create', 'Create CAPA items'),
  ('capa.view', 'capa', 'view', 'View CAPA items'),
  ('capa.update', 'capa', 'update', 'Update CAPA items'),
  ('capa.verify', 'capa', 'verify', 'Verify CAPA items'),
  ('reports.view', 'reports', 'view', 'View reports'),
  ('analytics.view', 'analytics', 'view', 'View analytics'),
  ('master_data.manage', 'master_data', 'manage', 'Manage master data')
on conflict (code) do nothing;

insert into public.roles (organization_id, code, name, description, is_system, is_default) values
  (null, 'super_admin', 'Super Admin', 'Platform super administrator', true, false),
  (null, 'tenant_admin', 'Tenant Admin', 'Organization owner/admin', true, false),
  (null, 'ehs_admin', 'EHS Admin', 'EHS configuration administrator', true, false),
  (null, 'ehs_manager', 'EHS Manager', 'EHS program manager', true, false),
  (null, 'ehs_officer', 'EHS Officer', 'Day-to-day EHS officer', true, false),
  (null, 'site_manager', 'Site Manager', 'Site operational owner', true, false),
  (null, 'department_head', 'Department Head', 'Department owner', true, false),
  (null, 'supervisor', 'Supervisor', 'First-line supervisor', true, false),
  (null, 'employee', 'Employee', 'Standard employee reporter', true, true),
  (null, 'contractor', 'Contractor', 'Contractor reporter', true, false),
  (null, 'auditor', 'Auditor', 'Internal/external auditor', true, false),
  (null, 'investigator', 'Investigator', 'Assigned investigator', true, false),
  (null, 'viewer', 'Viewer', 'Read-only viewer', true, false)
on conflict do nothing;

-- Map permissions to roles (system roles)
with role_map as (
  select r.id as role_id, r.code, p.id as permission_id, p.code as permission_code
  from public.roles r
  cross join public.permissions p
  where r.organization_id is null
)
insert into public.role_permissions (role_id, permission_id)
select role_id, permission_id from role_map
where
  (code = 'super_admin')
  or (code = 'tenant_admin' and permission_code <> 'platform.admin')
  or (code = 'ehs_admin' and permission_code in (
    'settings.manage','users.manage','users.view','sites.manage','sites.view','audit.view','dashboard.view',
    'incidents.create','incidents.view','incidents.update','incidents.investigate','incidents.approve','incidents.export',
    'near_miss.create','near_miss.view','near_miss.update','hazards.create','hazards.view','hazards.update',
    'capa.create','capa.view','capa.update','capa.verify','reports.view','analytics.view','master_data.manage','billing.view'
  ))
  or (code = 'ehs_manager' and permission_code in (
    'users.view','sites.view','audit.view','dashboard.view','billing.view',
    'incidents.create','incidents.view','incidents.update','incidents.investigate','incidents.approve','incidents.export',
    'near_miss.create','near_miss.view','near_miss.update','hazards.create','hazards.view','hazards.update',
    'capa.create','capa.view','capa.update','capa.verify','reports.view','analytics.view'
  ))
  or (code = 'ehs_officer' and permission_code in (
    'sites.view','dashboard.view',
    'incidents.create','incidents.view','incidents.update','incidents.investigate',
    'near_miss.create','near_miss.view','near_miss.update','hazards.create','hazards.view','hazards.update',
    'capa.create','capa.view','capa.update','reports.view'
  ))
  or (code = 'site_manager' and permission_code in (
    'sites.view','dashboard.view','incidents.view','incidents.approve','near_miss.view','hazards.view',
    'capa.view','capa.verify','reports.view'
  ))
  or (code = 'department_head' and permission_code in (
    'dashboard.view','incidents.view','near_miss.view','hazards.view','capa.view','capa.update'
  ))
  or (code = 'supervisor' and permission_code in (
    'dashboard.view','incidents.create','incidents.view','incidents.update',
    'near_miss.create','near_miss.view','hazards.create','hazards.view','capa.create','capa.view','capa.update'
  ))
  or (code = 'employee' and permission_code in (
    'dashboard.view','incidents.create','incidents.view','near_miss.create','near_miss.view','hazards.create','hazards.view','capa.view'
  ))
  or (code = 'contractor' and permission_code in (
    'incidents.create','incidents.view','near_miss.create','near_miss.view','hazards.create','hazards.view','capa.view'
  ))
  or (code = 'auditor' and permission_code in (
    'dashboard.view','incidents.view','near_miss.view','hazards.view','capa.view','audit.view','reports.view'
  ))
  or (code = 'investigator' and permission_code in (
    'incidents.view','incidents.update','incidents.investigate','capa.create','capa.view','capa.update'
  ))
  or (code = 'viewer' and permission_code in (
    'dashboard.view','incidents.view','near_miss.view','hazards.view','capa.view','reports.view'
  ))
on conflict do nothing;

insert into public.features (code, name, description, category, value_type) values
  ('incident_management', 'Incident Management', 'Incident reporting and investigation', 'module', 'boolean'),
  ('near_miss', 'Near Miss', 'Near miss reporting', 'module', 'boolean'),
  ('hazard_reporting', 'Hazard Reporting', 'Hazard / UA / UC reporting', 'module', 'boolean'),
  ('risk_assessment', 'Risk Assessment', 'Risk assessments', 'module', 'boolean'),
  ('jsa', 'JSA', 'Job Safety Analysis', 'module', 'boolean'),
  ('jha', 'JHA', 'Job Hazard Analysis', 'module', 'boolean'),
  ('permit_to_work', 'Permit to Work', 'PTW module', 'module', 'boolean'),
  ('inspections', 'Inspections', 'Inspection module', 'module', 'boolean'),
  ('audits', 'Audits', 'Audit module', 'module', 'boolean'),
  ('capa', 'CAPA', 'Corrective and preventive actions', 'module', 'boolean'),
  ('training', 'Training', 'Training and competency', 'module', 'boolean'),
  ('contractor_management', 'Contractor Management', 'Contractor safety', 'module', 'boolean'),
  ('ppe_management', 'PPE Management', 'PPE tracking', 'module', 'boolean'),
  ('chemical_sds', 'Chemical / SDS', 'Chemical register', 'module', 'boolean'),
  ('document_control', 'Document Control', 'Controlled documents', 'module', 'boolean'),
  ('moc', 'Management of Change', 'MOC module', 'module', 'boolean'),
  ('toolbox_talks', 'Toolbox Talks', 'Safety meetings', 'module', 'boolean'),
  ('advanced_reports', 'Advanced Reports', 'Advanced reporting', 'module', 'boolean'),
  ('scheduled_reports', 'Scheduled Reports', 'Scheduled report delivery', 'module', 'boolean'),
  ('api_access', 'API Access', 'Public API access', 'integration', 'boolean'),
  ('sso', 'SSO', 'SAML/OIDC SSO', 'integration', 'boolean'),
  ('hrms_integration', 'HRMS Integration', 'HRMS sync', 'integration', 'boolean'),
  ('whatsapp_notifications', 'WhatsApp Notifications', 'WhatsApp channel', 'integration', 'boolean'),
  ('sms_notifications', 'SMS Notifications', 'SMS channel', 'integration', 'boolean'),
  ('ai_copilot', 'AI Copilot', 'AI assistance', 'addon', 'boolean'),
  ('advanced_analytics', 'Advanced Analytics', 'Advanced analytics', 'module', 'boolean'),
  ('custom_branding', 'Custom Branding', 'Tenant branding', 'addon', 'boolean'),
  ('multi_business_unit', 'Multi Business Unit', 'Multiple BUs', 'module', 'boolean'),
  ('multi_site', 'Multi Site', 'Multiple sites', 'module', 'boolean'),
  ('custom_workflows', 'Custom Workflows', 'Configurable workflows', 'module', 'boolean'),
  ('max_users', 'Max Users', 'User seat limit', 'limit', 'numeric'),
  ('max_sites', 'Max Sites', 'Site limit', 'limit', 'numeric'),
  ('max_projects', 'Max Projects', 'Project limit', 'limit', 'numeric'),
  ('max_storage_mb', 'Max Storage (MB)', 'Storage limit', 'limit', 'numeric'),
  ('max_contractors', 'Max Contractors', 'Contractor limit', 'limit', 'numeric'),
  ('max_documents', 'Max Documents', 'Document limit', 'limit', 'numeric'),
  ('max_monthly_reports', 'Max Monthly Reports', 'Monthly report limit', 'limit', 'numeric'),
  ('max_api_calls', 'Max API Calls', 'API call limit', 'limit', 'numeric')
on conflict (code) do nothing;

insert into public.plans (code, name, description, is_active, is_public, is_custom, sort_order, trial_days, price_monthly_cents, price_yearly_cents) values
  ('free_trial', 'Free Trial', 'Trial access for evaluation', true, true, false, 10, 14, 0, 0),
  ('starter', 'Starter', 'Core EHS reporting for small teams', true, true, false, 20, 14, 9900, 99000),
  ('professional', 'Professional', 'Full EHS program for growing organizations', true, true, false, 30, 14, 24900, 249000),
  ('business', 'Business', 'Multi-site operations with advanced controls', true, true, false, 40, 14, 49900, 499000),
  ('enterprise', 'Enterprise', 'Enterprise scale with SSO and custom workflows', true, true, false, 50, 14, 0, 0),
  ('custom', 'Custom', 'Customer-specific commercial plan', true, false, true, 60, 30, 0, 0)
on conflict (code) do nothing;

-- Helper to attach plan features
create temporary table tmp_plan_feature_seed (
  plan_code text,
  feature_code text,
  enabled boolean,
  limit_value numeric,
  unlimited boolean
) on commit drop;

insert into tmp_plan_feature_seed (plan_code, feature_code, enabled, limit_value, unlimited) values
  -- free_trial core
  ('free_trial','incident_management',true,null,false),
  ('free_trial','near_miss',true,null,false),
  ('free_trial','hazard_reporting',true,null,false),
  ('free_trial','capa',true,null,false),
  ('free_trial','multi_site',true,null,false),
  ('free_trial','max_users',true,10,false),
  ('free_trial','max_sites',true,2,false),
  ('free_trial','max_projects',true,5,false),
  ('free_trial','max_storage_mb',true,1024,false),
  -- starter
  ('starter','incident_management',true,null,false),
  ('starter','near_miss',true,null,false),
  ('starter','hazard_reporting',true,null,false),
  ('starter','capa',true,null,false),
  ('starter','inspections',true,null,false),
  ('starter','toolbox_talks',true,null,false),
  ('starter','multi_site',true,null,false),
  ('starter','max_users',true,25,false),
  ('starter','max_sites',true,5,false),
  ('starter','max_projects',true,20,false),
  ('starter','max_storage_mb',true,5120,false),
  -- professional
  ('professional','incident_management',true,null,false),
  ('professional','near_miss',true,null,false),
  ('professional','hazard_reporting',true,null,false),
  ('professional','risk_assessment',true,null,false),
  ('professional','jsa',true,null,false),
  ('professional','jha',true,null,false),
  ('professional','permit_to_work',true,null,false),
  ('professional','inspections',true,null,false),
  ('professional','audits',true,null,false),
  ('professional','capa',true,null,false),
  ('professional','training',true,null,false),
  ('professional','contractor_management',true,null,false),
  ('professional','ppe_management',true,null,false),
  ('professional','document_control',true,null,false),
  ('professional','toolbox_talks',true,null,false),
  ('professional','advanced_reports',true,null,false),
  ('professional','advanced_analytics',true,null,false),
  ('professional','multi_site',true,null,false),
  ('professional','multi_business_unit',true,null,false),
  ('professional','max_users',true,100,false),
  ('professional','max_sites',true,25,false),
  ('professional','max_projects',true,100,false),
  ('professional','max_storage_mb',true,51200,false),
  -- business
  ('business','incident_management',true,null,false),
  ('business','near_miss',true,null,false),
  ('business','hazard_reporting',true,null,false),
  ('business','risk_assessment',true,null,false),
  ('business','jsa',true,null,false),
  ('business','jha',true,null,false),
  ('business','permit_to_work',true,null,false),
  ('business','inspections',true,null,false),
  ('business','audits',true,null,false),
  ('business','capa',true,null,false),
  ('business','training',true,null,false),
  ('business','contractor_management',true,null,false),
  ('business','ppe_management',true,null,false),
  ('business','chemical_sds',true,null,false),
  ('business','document_control',true,null,false),
  ('business','moc',true,null,false),
  ('business','toolbox_talks',true,null,false),
  ('business','advanced_reports',true,null,false),
  ('business','scheduled_reports',true,null,false),
  ('business','advanced_analytics',true,null,false),
  ('business','custom_branding',true,null,false),
  ('business','multi_site',true,null,false),
  ('business','multi_business_unit',true,null,false),
  ('business','custom_workflows',true,null,false),
  ('business','max_users',true,500,false),
  ('business','max_sites',true,100,false),
  ('business','max_projects',true,500,false),
  ('business','max_storage_mb',true,204800,false),
  -- enterprise unlimited-ish
  ('enterprise','incident_management',true,null,false),
  ('enterprise','near_miss',true,null,false),
  ('enterprise','hazard_reporting',true,null,false),
  ('enterprise','risk_assessment',true,null,false),
  ('enterprise','jsa',true,null,false),
  ('enterprise','jha',true,null,false),
  ('enterprise','permit_to_work',true,null,false),
  ('enterprise','inspections',true,null,false),
  ('enterprise','audits',true,null,false),
  ('enterprise','capa',true,null,false),
  ('enterprise','training',true,null,false),
  ('enterprise','contractor_management',true,null,false),
  ('enterprise','ppe_management',true,null,false),
  ('enterprise','chemical_sds',true,null,false),
  ('enterprise','document_control',true,null,false),
  ('enterprise','moc',true,null,false),
  ('enterprise','toolbox_talks',true,null,false),
  ('enterprise','advanced_reports',true,null,false),
  ('enterprise','scheduled_reports',true,null,false),
  ('enterprise','api_access',true,null,false),
  ('enterprise','sso',true,null,false),
  ('enterprise','hrms_integration',true,null,false),
  ('enterprise','ai_copilot',true,null,false),
  ('enterprise','advanced_analytics',true,null,false),
  ('enterprise','custom_branding',true,null,false),
  ('enterprise','multi_site',true,null,false),
  ('enterprise','multi_business_unit',true,null,false),
  ('enterprise','custom_workflows',true,null,false),
  ('enterprise','max_users',true,null,true),
  ('enterprise','max_sites',true,null,true),
  ('enterprise','max_projects',true,null,true),
  ('enterprise','max_storage_mb',true,null,true);

insert into public.plan_features (plan_id, feature_id, enabled, limit_value, unlimited)
select p.id, f.id, s.enabled, s.limit_value, s.unlimited
from tmp_plan_feature_seed s
join public.plans p on p.code = s.plan_code
join public.features f on f.code = s.feature_code
on conflict (plan_id, feature_id) do update
set enabled = excluded.enabled,
    limit_value = excluded.limit_value,
    unlimited = excluded.unlimited;

-- System event types
insert into public.event_types (organization_id, code, name, feature_code, description, is_system, sort_order) values
  (null, 'incident', 'Incident', 'incident_management', 'Injury/illness, property, environmental, security incidents', true, 10),
  (null, 'near_miss', 'Near Miss', 'near_miss', 'Near miss events with no harm', true, 20),
  (null, 'unsafe_act', 'Unsafe Act', 'hazard_reporting', 'Unsafe act observations', true, 30),
  (null, 'unsafe_condition', 'Unsafe Condition', 'hazard_reporting', 'Unsafe condition observations', true, 40),
  (null, 'hazard', 'Hazard', 'hazard_reporting', 'General hazard reports', true, 50)
on conflict do nothing;

insert into public.severity_levels (organization_id, code, name, rank, color, requires_investigation) values
  (null, 'low', 'Low', 1, '#90D7D7', false),
  (null, 'medium', 'Medium', 2, '#F5D671', false),
  (null, 'high', 'High', 3, '#E8A87C', true),
  (null, 'critical', 'Critical', 4, '#C38D9E', true)
on conflict do nothing;

insert into public.platform_settings (key, value, description) values
  ('billing', '{"provider":"manual","currency":"USD"}'::jsonb, 'Billing configuration placeholder'),
  ('support', '{"email":"support@ehs360.app"}'::jsonb, 'Support contact'),
  ('security', '{"mfa_recommended_roles":["tenant_admin","ehs_manager"]}'::jsonb, 'Security defaults')
on conflict (key) do nothing;


-- >>> 20260326000008_onboarding_bootstrap.sql
-- Bootstrap organization creation without RBAC chicken-and-egg

create or replace function public.bootstrap_organization(
  p_name text,
  p_slug text,
  p_industry text,
  p_company_type text default null,
  p_country text default null
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org public.organizations;
  v_member public.organization_members;
  v_role_id uuid;
  v_plan_id uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.organizations (
    name, slug, industry, company_type, country, status, trial_ends_at,
    created_by, updated_by, last_activity_at
  ) values (
    p_name,
    p_slug,
    p_industry,
    p_company_type,
    p_country,
    'trial',
    timezone('utc', now()) + interval '14 days',
    v_user,
    v_user,
    timezone('utc', now())
  )
  returning * into v_org;

  insert into public.organization_settings (organization_id)
  values (v_org.id);

  insert into public.organization_members (
    organization_id, user_id, status, is_owner, joined_at, created_by
  ) values (
    v_org.id, v_user, 'active', true, timezone('utc', now()), v_user
  )
  returning * into v_member;

  select id into v_role_id
  from public.roles
  where organization_id is null and code = 'tenant_admin'
  limit 1;

  if v_role_id is not null then
    insert into public.member_roles (member_id, role_id, scope)
    values (v_member.id, v_role_id, 'organization');
  end if;

  select id into v_plan_id
  from public.plans
  where code = 'free_trial'
  limit 1;

  if v_plan_id is not null then
    insert into public.subscriptions (
      organization_id, plan_id, status, billing_interval,
      trial_ends_at, current_period_start, current_period_end, created_by
    ) values (
      v_org.id, v_plan_id, 'trialing', 'monthly',
      v_org.trial_ends_at, timezone('utc', now()), v_org.trial_ends_at, v_user
    );

    insert into public.billing_accounts (organization_id, company_name)
    values (v_org.id, v_org.name);

    insert into public.subscription_events (
      organization_id, event_type, to_plan_id, created_by, payload
    ) values (
      v_org.id, 'trial_started', v_plan_id, v_user, '{"source":"onboarding"}'::jsonb
    );
  end if;

  insert into public.audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, new_values
  ) values (
    v_org.id, v_user, 'organization.created', 'organization', v_org.id,
    jsonb_build_object('name', v_org.name, 'industry', v_org.industry, 'status', v_org.status)
  );

  return v_org;
end;
$$;

grant execute on function public.bootstrap_organization(text, text, text, text, text) to authenticated;


-- >>> 20260326000009_risk_assessments.sql
-- Phase 6: configurable risk assessment engine (Risk / JSA / JHA)

create table public.risk_assessment_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, code)
);

create unique index risk_assessment_types_system_code_uidx
  on public.risk_assessment_types (code)
  where organization_id is null;

create table public.risk_matrices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null default 'Default 5x5',
  likelihood_max integer not null default 5 check (likelihood_max between 2 and 10),
  consequence_max integer not null default 5 check (consequence_max between 2 and 10),
  -- bands: [{code,name,min_score,max_score,color}] â€” never hard-coded in app logic
  bands jsonb not null default '[
    {"code":"low","name":"Low","min_score":1,"max_score":4,"color":"#22c55e"},
    {"code":"medium","name":"Medium","min_score":5,"max_score":9,"color":"#eab308"},
    {"code":"high","name":"High","min_score":10,"max_score":14,"color":"#f97316"},
    {"code":"critical","name":"Critical","min_score":15,"max_score":25,"color":"#ef4444"}
  ]'::jsonb,
  likelihood_labels jsonb not null default '["Rare","Unlikely","Possible","Likely","Almost Certain"]'::jsonb,
  consequence_labels jsonb not null default '["Insignificant","Minor","Moderate","Major","Catastrophic"]'::jsonb,
  is_default boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assessment_type_id uuid not null references public.risk_assessment_types (id),
  matrix_id uuid references public.risk_matrices (id),
  assessment_number text not null,
  title text not null,
  task_activity text,
  site_id uuid references public.sites (id),
  project_id uuid references public.projects (id),
  location_id uuid references public.locations (id),
  department_id uuid references public.departments (id),
  status text not null default 'draft'
    check (status in (
      'draft', 'team_assigned', 'in_progress', 'review', 'approval',
      'active', 'periodic_review', 'retired', 'cancelled'
    )),
  assessment_date date not null default (timezone('utc', now()))::date,
  next_review_date date,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  owner_id uuid references public.profiles (id),
  inherent_risk_score integer,
  inherent_risk_band text,
  residual_risk_score integer,
  residual_risk_band text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, assessment_number)
);

create table public.risk_assessment_team (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assessment_id uuid not null references public.risk_assessments (id) on delete cascade,
  user_id uuid references public.profiles (id),
  member_name text,
  role_label text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.risk_hazards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assessment_id uuid not null references public.risk_assessments (id) on delete cascade,
  hazard_description text not null,
  persons_at_risk text,
  sort_order integer not null default 0,
  inherent_likelihood integer check (inherent_likelihood between 1 and 10),
  inherent_consequence integer check (inherent_consequence between 1 and 10),
  inherent_score integer,
  inherent_band text,
  residual_likelihood integer check (residual_likelihood between 1 and 10),
  residual_consequence integer check (residual_consequence between 1 and 10),
  residual_score integer,
  residual_band text,
  owner_id uuid references public.profiles (id),
  target_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.risk_controls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  hazard_id uuid not null references public.risk_hazards (id) on delete cascade,
  control_type text not null
    check (control_type in ('existing', 'additional')),
  hierarchy text not null
    check (hierarchy in ('elimination', 'substitution', 'engineering', 'administrative', 'ppe')),
  description text not null,
  owner_id uuid references public.profiles (id),
  target_date date,
  capa_id uuid references public.capa_items (id) on delete set null,
  is_implemented boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create index risk_assessments_org_status_idx on public.risk_assessments (organization_id, status);
create index risk_hazards_assessment_idx on public.risk_hazards (assessment_id);
create index risk_controls_hazard_idx on public.risk_controls (hazard_id);

insert into public.risk_assessment_types (organization_id, code, name, description, is_system)
values
  (null, 'risk_assessment', 'Risk Assessment', 'General task/area risk assessment', true),
  (null, 'jsa', 'Job Safety Analysis', 'Job safety analysis', true),
  (null, 'jha', 'Job Hazard Analysis', 'Job hazard analysis', true)
on conflict do nothing;

create or replace function public.resolve_risk_band(
  p_matrix_id uuid,
  p_score integer
)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_band text;
begin
  if p_score is null or p_matrix_id is null then
    return null;
  end if;
  select b->>'code' into v_band
  from public.risk_matrices m
  cross join lateral jsonb_array_elements(m.bands) b
  where m.id = p_matrix_id
    and p_score between (b->>'min_score')::int and (b->>'max_score')::int
  order by (b->>'min_score')::int
  limit 1;
  return v_band;
end;
$$;

create trigger risk_assessment_types_updated_at before update on public.risk_assessment_types
  for each row execute function public.set_updated_at();
create trigger risk_matrices_updated_at before update on public.risk_matrices
  for each row execute function public.set_updated_at();
create trigger risk_assessments_updated_at before update on public.risk_assessments
  for each row execute function public.set_updated_at();
create trigger risk_hazards_updated_at before update on public.risk_hazards
  for each row execute function public.set_updated_at();
create trigger risk_controls_updated_at before update on public.risk_controls
  for each row execute function public.set_updated_at();

