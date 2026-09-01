-- P0 production hardening: LMRA / site visit / MIS workflow RLS + DB guards

-- ---------------------------------------------------------------------------
-- LMRA: replace permissive update policy
-- ---------------------------------------------------------------------------
drop policy if exists lmra_update on public.lmra_assessments;

create policy lmra_update_creator_draft on public.lmra_assessments
  for update
  using (
    public.is_platform_admin()
    or (
      created_by = auth.uid()
      and status = 'draft'
      and public.has_org_permission(organization_id, 'lmra.create')
    )
  )
  with check (
    public.is_platform_admin()
    or (
      created_by = auth.uid()
      and status in ('draft', 'submitted')
      and public.has_org_permission(organization_id, 'lmra.create')
      and reviewed_at is null
      and reviewed_by is null
    )
  );

create policy lmra_update_approve on public.lmra_assessments
  for update
  using (
    public.is_platform_admin()
    or (
      public.has_org_permission(organization_id, 'lmra.approve')
      and status = 'submitted'
    )
  )
  with check (
    public.is_platform_admin()
    or (
      public.has_org_permission(organization_id, 'lmra.approve')
      and status in ('approved', 'rejected')
      and reviewed_by = auth.uid()
      and (created_by is distinct from auth.uid() or public.is_platform_admin())
    )
  );

create policy lmra_update_admin on public.lmra_assessments
  for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create or replace function public.guard_lmra_status_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    if old.status in ('approved', 'rejected') and not public.is_platform_admin() then
      raise exception 'LMRA record is immutable after review';
    end if;

    if old.status = 'submitted' and new.status in ('approved', 'rejected') then
      if auth.uid() is not null and not public.is_platform_admin() then
        if not public.has_org_permission(new.organization_id, 'lmra.approve') then
          raise exception 'lmra.approve permission required';
        end if;
        if old.created_by = auth.uid() then
          raise exception 'creator cannot approve own LMRA';
        end if;
      end if;
    end if;

    if old.status = 'draft' and new.status = 'submitted' then
      if auth.uid() is not null
        and old.created_by is distinct from auth.uid()
        and not public.is_platform_admin() then
        raise exception 'only creator can submit draft LMRA';
      end if;
    end if;

    if old.status = 'submitted'
      and new.status not in ('approved', 'rejected')
      and not public.is_platform_admin() then
      raise exception 'submitted LMRA cannot change status except via review';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_lmra_status_transition on public.lmra_assessments;
create trigger guard_lmra_status_transition
  before update on public.lmra_assessments
  for each row execute function public.guard_lmra_status_transition();

-- ---------------------------------------------------------------------------
-- Site visits: permission-scoped insert/update
-- ---------------------------------------------------------------------------
drop policy if exists site_visits_insert on public.site_visits;
drop policy if exists site_visits_update on public.site_visits;

create policy site_visits_insert on public.site_visits
  for insert
  with check (
    public.is_platform_admin()
    or (
      visit_type = 'hsv'
      and public.has_org_permission(organization_id, 'visits.hsv.create')
    )
    or (
      visit_type = 'rsv'
      and public.has_org_permission(organization_id, 'visits.rsv.create')
    )
    or (
      visit_type = 'tsv'
      and public.has_org_permission(organization_id, 'visits.tsv.create')
    )
  );

create policy site_visits_update_creator_draft on public.site_visits
  for update
  using (
    public.is_platform_admin()
    or (
      created_by = auth.uid()
      and status = 'draft'
      and (
        (visit_type = 'hsv' and public.has_org_permission(organization_id, 'visits.hsv.create'))
        or (visit_type = 'rsv' and public.has_org_permission(organization_id, 'visits.rsv.create'))
        or (visit_type = 'tsv' and public.has_org_permission(organization_id, 'visits.tsv.create'))
      )
    )
  )
  with check (
    public.is_platform_admin()
    or (
      created_by = auth.uid()
      and status in ('draft', 'submitted')
    )
  );

create policy site_visits_update_allocate on public.site_visits
  for update
  using (
    public.is_platform_admin()
    or (
      public.has_org_permission(organization_id, 'visits.allocate')
      and status in ('submitted', 'allocated', 'closed')
    )
  )
  with check (
    public.is_platform_admin()
    or public.has_org_permission(organization_id, 'visits.allocate')
  );

create policy site_visits_update_final_close on public.site_visits
  for update
  using (
    public.is_platform_admin()
    or (
      public.has_org_permission(organization_id, 'visits.final_close')
      and status in ('closed', 'final_closed')
    )
  )
  with check (
    public.is_platform_admin()
    or (
      public.has_org_permission(organization_id, 'visits.final_close')
      and status in ('closed', 'final_closed')
    )
  );

create policy site_visits_update_admin on public.site_visits
  for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create or replace function public.guard_site_visit_status_transition()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  allowed boolean := false;
begin
  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    if old.status in ('final_closed', 'cancelled') and not public.is_platform_admin() then
      raise exception 'site visit is closed and immutable';
    end if;

    if old.status = 'draft' and new.status = 'submitted' then
      allowed := true;
    elsif old.status = 'submitted' and new.status = 'allocated' then
      allowed := public.is_platform_admin()
        or public.has_org_permission(new.organization_id, 'visits.allocate');
    elsif old.status = 'allocated' and new.status = 'closed' then
      allowed := public.is_platform_admin()
        or public.has_org_permission(new.organization_id, 'visits.allocate');
    elsif old.status = 'closed' and new.status = 'final_closed' then
      allowed := public.is_platform_admin()
        or public.has_org_permission(new.organization_id, 'visits.final_close');
    elsif new.status = 'cancelled' and old.status in ('draft', 'submitted') then
      allowed := old.created_by = auth.uid() or public.is_platform_admin();
    end if;

    if not allowed and not public.is_platform_admin() then
      raise exception 'invalid site visit status transition: % -> %', old.status, new.status;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_site_visit_status_transition on public.site_visits;
create trigger guard_site_visit_status_transition
  before update on public.site_visits
  for each row execute function public.guard_site_visit_status_transition();

-- ---------------------------------------------------------------------------
-- MIS submissions: tighten status transition updates
-- ---------------------------------------------------------------------------
drop policy if exists mis_submissions_update on public.mis_submissions;

create policy mis_submissions_update_editor on public.mis_submissions
  for update
  using (
    public.is_platform_admin()
    or (
      status in ('draft', 'submitted')
      and public.has_org_permission(organization_id, 'mis.edit')
    )
  )
  with check (
    public.is_platform_admin()
    or (
      public.has_org_permission(organization_id, 'mis.edit')
      and status in ('draft', 'submitted')
      and reviewed_at is null
    )
  );

create policy mis_submissions_update_approve on public.mis_submissions
  for update
  using (
    public.is_platform_admin()
    or (
      public.has_org_permission(organization_id, 'mis.approve')
      and status = 'submitted'
    )
  )
  with check (
    public.is_platform_admin()
    or (
      public.has_org_permission(organization_id, 'mis.approve')
      and status in ('approved', 'rejected')
      and reviewed_by = auth.uid()
    )
  );

create policy mis_submissions_update_admin on public.mis_submissions
  for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create or replace function public.guard_mis_submission_status_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    if old.status in ('approved', 'rejected', 'cancelled') and not public.is_platform_admin() then
      raise exception 'MIS submission is immutable after review';
    end if;

    if old.status = 'submitted' and new.status in ('approved', 'rejected') then
      if auth.uid() is not null
        and not public.is_platform_admin()
        and not public.has_org_permission(new.organization_id, 'mis.approve') then
        raise exception 'mis.approve permission required';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_mis_submission_status_transition on public.mis_submissions;
create trigger guard_mis_submission_status_transition
  before update on public.mis_submissions
  for each row execute function public.guard_mis_submission_status_transition();

-- Concurrency-safe MIS period creation helper
create or replace function public.ensure_mis_period(
  p_organization_id uuid,
  p_period_start date,
  p_period_end date,
  p_label text,
  p_user_id uuid default auth.uid()
)
returns public.mis_periods
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.mis_periods;
begin
  if p_organization_id is null then
    raise exception 'organization required';
  end if;

  if auth.uid() is not null then
    if not (public.is_platform_admin() or public.is_org_member(p_organization_id)) then
      raise exception 'not authorized';
    end if;
  elsif current_setting('role') not in ('service_role', 'supabase_admin', 'postgres') then
    raise exception 'not authorized';
  end if;

  insert into public.mis_periods (
    organization_id, label, period_start, period_end, status, created_by, updated_by
  )
  values (
    p_organization_id, p_label, p_period_start, p_period_end, 'open', p_user_id, p_user_id
  )
  on conflict (organization_id, period_start, period_end)
  do update set updated_at = timezone('utc', now())
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.ensure_mis_period(uuid, date, date, text, uuid) from public;
grant execute on function public.ensure_mis_period(uuid, date, date, text, uuid) to authenticated;
grant execute on function public.ensure_mis_period(uuid, date, date, text, uuid) to service_role;
