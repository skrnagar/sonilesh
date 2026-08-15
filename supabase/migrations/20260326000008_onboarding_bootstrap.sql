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
