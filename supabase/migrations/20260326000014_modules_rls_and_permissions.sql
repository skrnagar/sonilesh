-- RLS + permissions for phases 6–10

insert into public.permissions (code, module, action, description) values
  ('risk.view', 'risk', 'view', 'View risk assessments'),
  ('risk.create', 'risk', 'create', 'Create risk assessments'),
  ('risk.update', 'risk', 'update', 'Update risk assessments'),
  ('risk.approve', 'risk', 'approve', 'Approve risk assessments'),
  ('permits.view', 'permits', 'view', 'View permits'),
  ('permits.create', 'permits', 'create', 'Create permits'),
  ('permits.approve', 'permits', 'approve', 'Approve permits'),
  ('permits.close', 'permits', 'close', 'Close permits'),
  ('inspections.view', 'inspections', 'view', 'View inspections'),
  ('inspections.conduct', 'inspections', 'conduct', 'Conduct inspections'),
  ('audits.view', 'audits', 'view', 'View audits'),
  ('audits.conduct', 'audits', 'conduct', 'Conduct audits'),
  ('checklists.manage', 'checklists', 'manage', 'Manage checklist templates'),
  ('training.view', 'training', 'view', 'View training'),
  ('training.manage', 'training', 'manage', 'Manage training'),
  ('contractors.view', 'contractors', 'view', 'View contractors'),
  ('contractors.manage', 'contractors', 'manage', 'Manage contractors'),
  ('ppe.view', 'ppe', 'view', 'View PPE'),
  ('ppe.manage', 'ppe', 'manage', 'Manage PPE'),
  ('chemicals.view', 'chemicals', 'view', 'View chemicals'),
  ('chemicals.manage', 'chemicals', 'manage', 'Manage chemicals'),
  ('documents.view', 'documents', 'view', 'View documents'),
  ('documents.manage', 'documents', 'manage', 'Manage documents'),
  ('moc.view', 'moc', 'view', 'View MOC'),
  ('moc.manage', 'moc', 'manage', 'Manage MOC'),
  ('toolbox.view', 'toolbox', 'view', 'View toolbox talks'),
  ('toolbox.manage', 'toolbox', 'manage', 'Manage toolbox talks'),
  ('actions.view', 'actions', 'view', 'View action items'),
  ('actions.manage', 'actions', 'manage', 'Manage action items'),
  ('field.access', 'field', 'access', 'Access field experience')
on conflict (code) do nothing;

-- Grant new permissions to tenant_admin / ehs_manager system roles when present
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code in ('tenant_admin', 'ehs_manager', 'ehs_officer')
  and p.code in (
    'risk.view','risk.create','risk.update','risk.approve',
    'permits.view','permits.create','permits.approve','permits.close',
    'inspections.view','inspections.conduct','audits.view','audits.conduct',
    'checklists.manage','training.view','training.manage',
    'contractors.view','contractors.manage','ppe.view','ppe.manage',
    'chemicals.view','chemicals.manage','documents.view','documents.manage',
    'moc.view','moc.manage','toolbox.view','toolbox.manage',
    'actions.view','actions.manage','field.access','capa.view','capa.create','capa.update'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code in ('supervisor', 'employee')
  and p.code in (
    'risk.view','permits.view','inspections.view','training.view',
    'toolbox.view','actions.view','field.access','capa.view'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.code = 'contractor'
  and p.code in ('field.access','permits.view','training.view','actions.view')
on conflict do nothing;

do $$
declare
  t text;
begin
  foreach t in array array[
    'risk_assessment_types','risk_matrices','risk_assessments','risk_assessment_team',
    'risk_hazards','risk_controls','permit_types','permits','permit_checklist_items',
    'permit_approvals','permit_extensions','permit_attachments','checklist_templates',
    'checklist_sections','checklist_questions','checklist_options','finding_categories',
    'checklist_assignments','checklist_responses','checklist_findings','capa_activity',
    'training_types','training_courses','competency_matrix','training_assignments',
    'contractor_companies','contractor_workers','contractor_documents',
    'ppe_categories','ppe_items','ppe_requirements','ppe_issuances',
    'chemicals','chemical_sds','controlled_documents','document_versions',
    'document_acknowledgements','moc_requests','toolbox_talks','toolbox_attendance',
    'action_items'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Helper: org-member ALL policy factory via dynamic SQL
do $$
declare
  t text;
begin
  foreach t in array array[
    'risk_matrices','risk_assessments','risk_assessment_team','risk_hazards','risk_controls',
    'permits','permit_checklist_items','permit_approvals','permit_extensions','permit_attachments',
    'checklist_templates','checklist_sections','checklist_questions','checklist_options',
    'checklist_assignments','checklist_responses','checklist_findings','capa_activity',
    'training_types','training_courses','competency_matrix','training_assignments',
    'contractor_companies','contractor_workers','contractor_documents',
    'ppe_categories','ppe_items','ppe_requirements','ppe_issuances',
    'chemicals','chemical_sds','controlled_documents','document_versions',
    'document_acknowledgements','moc_requests','toolbox_talks','toolbox_attendance',
    'action_items'
  ]
  loop
    execute format(
      'create policy %I on public.%I for all using (public.is_platform_admin() or public.is_org_member(organization_id)) with check (public.is_platform_admin() or public.is_org_member(organization_id))',
      t || '_tenant', t
    );
  end loop;
end $$;

create policy risk_assessment_types_read on public.risk_assessment_types
  for select using (
    organization_id is null
    or public.is_platform_admin()
    or public.is_org_member(organization_id)
  );
create policy risk_assessment_types_write on public.risk_assessment_types
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  );

create policy permit_types_read on public.permit_types
  for select using (
    organization_id is null
    or public.is_platform_admin()
    or public.is_org_member(organization_id)
  );
create policy permit_types_write on public.permit_types
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  );

create policy finding_categories_read on public.finding_categories
  for select using (
    organization_id is null
    or public.is_platform_admin()
    or public.is_org_member(organization_id)
  );
create policy finding_categories_write on public.finding_categories
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  );
