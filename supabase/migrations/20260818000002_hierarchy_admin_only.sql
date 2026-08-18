-- Tighten hierarchy/org mutation rights.
-- UI already requires settings.manage, but older table RLS policies allowed any
-- active org member to mutate organization structure directly.

-- Organizations: keep member read access, require settings.manage for updates.
drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update
  using (
    public.is_platform_admin()
    or public.has_org_permission(id, 'settings.manage')
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(id, 'settings.manage')
  );

-- Business units
drop policy if exists business_units_tenant on public.business_units;
create policy business_units_select on public.business_units
  for select using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  );
create policy business_units_mutate on public.business_units
  for insert with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );
create policy business_units_update on public.business_units
  for update using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );
create policy business_units_delete on public.business_units
  for delete using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );

-- Sites
drop policy if exists sites_tenant on public.sites;
create policy sites_select on public.sites
  for select using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  );
create policy sites_mutate on public.sites
  for insert with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );
create policy sites_update on public.sites
  for update using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );
create policy sites_delete on public.sites
  for delete using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );

-- Projects
drop policy if exists projects_tenant on public.projects;
create policy projects_select on public.projects
  for select using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  );
create policy projects_mutate on public.projects
  for insert with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );
create policy projects_update on public.projects
  for update using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );
create policy projects_delete on public.projects
  for delete using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );

-- Departments
drop policy if exists departments_tenant on public.departments;
create policy departments_select on public.departments
  for select using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  );
create policy departments_mutate on public.departments
  for insert with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );
create policy departments_update on public.departments
  for update using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );
create policy departments_delete on public.departments
  for delete using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );

-- Locations
drop policy if exists locations_tenant on public.locations;
create policy locations_select on public.locations
  for select using (
    public.is_platform_admin() or public.is_org_member(organization_id)
  );
create policy locations_mutate on public.locations
  for insert with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );
create policy locations_update on public.locations
  for update using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  )
  with check (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );
create policy locations_delete on public.locations
  for delete using (
    public.is_platform_admin() or public.has_org_permission(organization_id, 'settings.manage')
  );
