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
