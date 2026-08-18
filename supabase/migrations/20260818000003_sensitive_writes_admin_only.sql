-- Authorization hardening for sensitive writes.
-- Pattern: members can SELECT; mutations require the matching permission.
-- Bootstrap/onboarding still works via security-definer RPC plus a creator-only fallback.

create or replace function public.has_any_org_permission(
  p_organization_id uuid,
  p_codes text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from unnest(coalesce(p_codes, array[]::text[])) as code
    where public.has_org_permission(p_organization_id, code)
  );
$$;

revoke all on function public.has_any_org_permission(uuid, text[]) from public;
revoke execute on function public.has_any_org_permission(uuid, text[]) from anon;
grant execute on function public.has_any_org_permission(uuid, text[]) to authenticated;
grant execute on function public.has_any_org_permission(uuid, text[]) to service_role;

-- ---------------------------------------------------------------------------
-- Users / roles / invitations
-- ---------------------------------------------------------------------------

drop policy if exists invitations_tenant on public.organization_invitations;
drop policy if exists organization_invitations_select on public.organization_invitations;
drop policy if exists organization_invitations_insert on public.organization_invitations;
drop policy if exists organization_invitations_update on public.organization_invitations;
drop policy if exists organization_invitations_delete on public.organization_invitations;
create policy organization_invitations_select on public.organization_invitations
  for select using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  );
create policy organization_invitations_insert on public.organization_invitations
  for insert with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'users.manage')
  );
create policy organization_invitations_update on public.organization_invitations
  for update using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'users.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'users.manage')
  );
create policy organization_invitations_delete on public.organization_invitations
  for delete using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'users.manage')
  );

-- Stop "join any org as yourself" via WITH CHECK.
drop policy if exists organization_members_mutate on public.organization_members;
create policy organization_members_mutate on public.organization_members
  for all using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'users.manage')
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'users.manage')
  );

-- Fallback onboarding insert: only the org creator, and only the first owner.
drop policy if exists organization_members_bootstrap_insert on public.organization_members;
create policy organization_members_bootstrap_insert on public.organization_members
  for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and is_owner = true
    and status = 'active'
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and o.created_by = auth.uid()
    )
    and not exists (
      select 1 from public.organization_members existing
      where existing.organization_id = organization_members.organization_id
        and existing.is_owner = true
        and existing.deleted_at is null
    )
  );

drop policy if exists member_roles_bootstrap_insert on public.member_roles;
create policy member_roles_bootstrap_insert on public.member_roles
  for insert
  with check (
    auth.uid() is not null
    and exists (
      select 1
      from public.organization_members m
      join public.organizations o on o.id = m.organization_id
      join public.roles r on r.id = member_roles.role_id
      where m.id = member_id
        and m.user_id = auth.uid()
        and m.is_owner = true
        and o.created_by = auth.uid()
        and r.organization_id is null
        and r.code = 'tenant_admin'
    )
  );

-- ---------------------------------------------------------------------------
-- Reporting config / EHS master data
-- ---------------------------------------------------------------------------

drop policy if exists event_categories_tenant on public.event_categories;
drop policy if exists event_categories_select on public.event_categories;
drop policy if exists event_categories_mutate on public.event_categories;
create policy event_categories_select on public.event_categories
  for select using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  );
create policy event_categories_mutate on public.event_categories
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );

drop policy if exists severity_levels_mutate on public.severity_levels;
create policy severity_levels_mutate on public.severity_levels
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and public.has_org_permission(organization_id, 'settings.manage'))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.has_org_permission(organization_id, 'settings.manage'))
  );

drop policy if exists report_custom_fields_defs on public.report_custom_field_definitions;
drop policy if exists report_custom_fields_defs_select on public.report_custom_field_definitions;
drop policy if exists report_custom_fields_defs_mutate on public.report_custom_field_definitions;
create policy report_custom_fields_defs_select on public.report_custom_field_definitions
  for select using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  );
create policy report_custom_fields_defs_mutate on public.report_custom_field_definitions
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );

drop policy if exists project_types_tenant on public.organization_project_types;
drop policy if exists project_types_select on public.organization_project_types;
drop policy if exists project_types_mutate on public.organization_project_types;
create policy project_types_select on public.organization_project_types
  for select using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  );
create policy project_types_mutate on public.organization_project_types
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );

drop policy if exists number_sequences_tenant on public.number_sequences;
drop policy if exists number_sequences_select on public.number_sequences;
drop policy if exists number_sequences_mutate on public.number_sequences;
create policy number_sequences_select on public.number_sequences
  for select using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  );
create policy number_sequences_mutate on public.number_sequences
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );

-- Idempotent template seed stays member-callable (security definer bypasses table RLS).
-- Destructive category edits go through event_categories_mutate above.

-- ---------------------------------------------------------------------------
-- Billing: members may read; only org admins mutate
-- ---------------------------------------------------------------------------

drop policy if exists billing_accounts_tenant on public.billing_accounts;
drop policy if exists billing_accounts_select on public.billing_accounts;
drop policy if exists billing_accounts_mutate on public.billing_accounts;
create policy billing_accounts_select on public.billing_accounts
  for select using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  );
create policy billing_accounts_mutate on public.billing_accounts
  for all using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );

drop policy if exists subscriptions_tenant_update on public.subscriptions;
create policy subscriptions_tenant_update on public.subscriptions
  for update using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );

-- ---------------------------------------------------------------------------
-- Compliance / legal / ESG
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('org_compliance_profile', array['compliance.manage']),
      ('org_applicable_compliances', array['compliance.manage']),
      ('compliance_task_instances', array['compliance.manage','compliance.assess','compliance.verify']),
      ('compliance_evidence', array['compliance.manage','compliance.assess','compliance.verify']),
      ('esg_committee', array['esg.manage']),
      ('materiality_assessment', array['esg.manage']),
      ('ghg_emissions', array['esg.manage']),
      ('esg_metrics', array['esg.manage']),
      ('epr_registrations', array['esg.manage']),
      ('brsr_reports', array['esg.manage','brsr.manage']),
      ('legal_register_entries', array['legal_register.manage']),
      ('compliance_requirements', array['legal_register.manage','compliance.manage']),
      ('compliance_assessments', array['compliance.assess','compliance.manage']),
      ('applicability_snapshots', array['compliance.manage']),
      ('regulatory_permits', array['regulatory_permits.manage']),
      ('permit_conditions', array['regulatory_permits.manage']),
      ('regulatory_update_impacts', array['legal_register.manage','compliance.manage']),
      ('esg_metric_values', array['esg.manage','esg.verify','esg.approve']),
      ('esg_reporting_periods', array['esg.manage','esg.approve']),
      ('esg_metric_verifications', array['esg.manage','esg.verify','esg.approve'])
    ) as t(tbl, perms)
  loop
    if to_regclass('public.' || r.tbl) is null then
      continue;
    end if;
    execute format('drop policy if exists %I on public.%I', r.tbl || '_tenant', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl || '_select', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl || '_insert', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl || '_update', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl || '_delete', r.tbl);
    execute format(
      'create policy %I on public.%I for select using (public.is_platform_admin() or public.is_org_member(organization_id))',
      r.tbl || '_select', r.tbl
    );
    execute format(
      'create policy %I on public.%I for insert with check (public.is_platform_admin() or public.has_any_org_permission(organization_id, %L::text[]))',
      r.tbl || '_insert', r.tbl, r.perms
    );
    execute format(
      'create policy %I on public.%I for update using (public.is_platform_admin() or public.has_any_org_permission(organization_id, %L::text[])) with check (public.is_platform_admin() or public.has_any_org_permission(organization_id, %L::text[]))',
      r.tbl || '_update', r.tbl, r.perms, r.perms
    );
    execute format(
      'create policy %I on public.%I for delete using (public.is_platform_admin() or public.has_any_org_permission(organization_id, %L::text[]))',
      r.tbl || '_delete', r.tbl, r.perms
    );
  end loop;
end $$;

drop policy if exists jurisdictions_write on public.jurisdictions;
create policy jurisdictions_write on public.jurisdictions
  for insert with check (
    public.is_platform_admin()
    or (organization_id is not null and public.has_any_org_permission(organization_id, array['legal_register.manage','compliance.manage']))
  );
drop policy if exists jurisdictions_update on public.jurisdictions;
create policy jurisdictions_update on public.jurisdictions
  for update using (
    public.is_platform_admin()
    or (organization_id is not null and public.has_any_org_permission(organization_id, array['legal_register.manage','compliance.manage']))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.has_any_org_permission(organization_id, array['legal_register.manage','compliance.manage']))
  );
drop policy if exists jurisdictions_delete on public.jurisdictions;
create policy jurisdictions_delete on public.jurisdictions
  for delete using (
    public.is_platform_admin()
    or (organization_id is not null and public.has_any_org_permission(organization_id, array['legal_register.manage','compliance.manage']))
  );

drop policy if exists regulations_write on public.regulations;
create policy regulations_write on public.regulations
  for insert with check (
    public.is_platform_admin()
    or (organization_id is not null and public.has_org_permission(organization_id, 'legal_register.manage'))
  );
drop policy if exists regulations_update on public.regulations;
create policy regulations_update on public.regulations
  for update using (
    public.is_platform_admin()
    or (organization_id is not null and public.has_org_permission(organization_id, 'legal_register.manage'))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.has_org_permission(organization_id, 'legal_register.manage'))
  );
drop policy if exists regulations_delete on public.regulations;
create policy regulations_delete on public.regulations
  for delete using (
    public.is_platform_admin()
    or (organization_id is not null and public.has_org_permission(organization_id, 'legal_register.manage'))
  );

drop policy if exists esg_metric_definitions_write on public.esg_metric_definitions;
create policy esg_metric_definitions_write on public.esg_metric_definitions
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and public.has_org_permission(organization_id, 'esg.manage'))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.has_org_permission(organization_id, 'esg.manage'))
  );

drop policy if exists regulatory_updates_write on public.regulatory_updates;
create policy regulatory_updates_write on public.regulatory_updates
  for all using (
    public.is_platform_admin()
    or (organization_id is not null and public.has_any_org_permission(organization_id, array['legal_register.manage','compliance.manage']))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and public.has_any_org_permission(organization_id, array['legal_register.manage','compliance.manage']))
  );

-- ---------------------------------------------------------------------------
-- Contractors: no portal WITH CHECK on status/blacklist/performance; inductions not member-delete
-- ---------------------------------------------------------------------------

drop policy if exists contractor_companies_update on public.contractor_companies;
create policy contractor_companies_update on public.contractor_companies
  for update using (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'contractor.update')
    or public.has_org_permission(organization_id, 'contractor.manage')
    or public.has_org_permission(organization_id, 'contractors.manage')
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'contractor.update')
    or public.has_org_permission(organization_id, 'contractor.manage')
    or public.has_org_permission(organization_id, 'contractors.manage')
  );

drop policy if exists contractor_inductions_tenant on public.contractor_inductions;
drop policy if exists contractor_inductions_select on public.contractor_inductions;
drop policy if exists contractor_inductions_insert on public.contractor_inductions;
drop policy if exists contractor_inductions_update on public.contractor_inductions;
drop policy if exists contractor_inductions_delete on public.contractor_inductions;
create policy contractor_inductions_select on public.contractor_inductions
  for select using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  );
create policy contractor_inductions_insert on public.contractor_inductions
  for insert with check (
    public.is_platform_admin()
    or public.has_any_org_permission(organization_id, array['contractor.manage','contractor.update','contractors.manage'])
  );
create policy contractor_inductions_update on public.contractor_inductions
  for update using (
    public.is_platform_admin()
    or public.has_any_org_permission(organization_id, array['contractor.manage','contractor.update','contractors.manage'])
  )
  with check (
    public.is_platform_admin()
    or public.has_any_org_permission(organization_id, array['contractor.manage','contractor.update','contractors.manage'])
  );
create policy contractor_inductions_delete on public.contractor_inductions
  for delete using (
    public.is_platform_admin()
    or public.has_any_org_permission(organization_id, array['contractor.manage','contractors.manage'])
  );

do $$
declare
  t text;
  staff_check text := $p$
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'contractor.manage')
    or public.has_org_permission(organization_id, 'contractors.manage')
    or public.has_org_permission(organization_id, 'contractor.update')
    or public.has_org_permission(organization_id, 'contractor.create')
    or public.has_org_permission(organization_id, 'contractor_access.manage')
  $p$;
begin
  foreach t in array array[
    'contractor_prequalification','contractor_contracts','contractor_assessments',
    'contractor_performance','contractor_status_history','contractor_blacklist_records',
    'contractor_invites'
  ]
  loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    execute format('drop policy if exists %I on public.%I', t || '_write', t);
    execute format(
      'create policy %I on public.%I for all using (%s) with check (%s)',
      t || '_write', t, staff_check, staff_check
    );
  end loop;
end $$;
