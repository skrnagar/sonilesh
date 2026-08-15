import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";

async function assertPlatformAdmin(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.is_platform_admin) {
    throw new Error("Platform admin required");
  }
}

export async function getSaaSDashboardMetrics(supabase: SupabaseClient) {
  const [
    orgs,
    members,
    sites,
    subscriptions,
  ] = await Promise.all([
    supabase.from("organizations").select("id, status, created_at, deleted_at"),
    supabase.from("organization_members").select("id, status").eq("status", "active"),
    supabase.from("sites").select("id").is("deleted_at", null),
    supabase
      .from("subscriptions")
      .select("id, status, plan_id, custom_price_monthly_cents, custom_price_yearly_cents, billing_interval, plans:plan_id(code, name, price_monthly_cents, price_yearly_cents)")
      .is("deleted_at", null),
  ]);

  const organizations = orgs.data ?? [];
  const activeOrgs = organizations.filter((o) => o.status === "active" && !o.deleted_at);
  const trialOrgs = organizations.filter((o) => o.status === "trial" && !o.deleted_at);
  const suspendedOrgs = organizations.filter((o) => o.status === "suspended" && !o.deleted_at);
  const churnedOrgs = organizations.filter((o) => o.status === "churned" && !o.deleted_at);

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const newOrgs = organizations.filter(
    (o) => o.created_at && new Date(o.created_at) >= monthStart,
  );

  let mrr = 0;
  let arr = 0;
  const planDistribution: Record<string, number> = {};

  for (const sub of subscriptions.data ?? []) {
    const plan = sub.plans as unknown as {
      code?: string;
      name?: string;
      price_monthly_cents?: number;
      price_yearly_cents?: number;
    } | null;
    const planName = plan?.name ?? plan?.code ?? "Unknown";
    planDistribution[planName] = (planDistribution[planName] ?? 0) + 1;

    if (!["active", "trialing", "past_due"].includes(sub.status)) continue;

    const monthly =
      sub.custom_price_monthly_cents ??
      plan?.price_monthly_cents ??
      0;
    const yearly =
      sub.custom_price_yearly_cents ??
      plan?.price_yearly_cents ??
      monthly * 12;

    if (sub.billing_interval === "yearly") {
      mrr += Math.round(yearly / 12);
      arr += yearly;
    } else {
      mrr += monthly;
      arr += monthly * 12;
    }
  }

  return {
    totalOrganizations: organizations.filter((o) => !o.deleted_at).length,
    activeOrganizations: activeOrgs.length,
    trialOrganizations: trialOrgs.length,
    suspendedOrganizations: suspendedOrgs.length,
    activeUsers: members.data?.length ?? 0,
    activeSites: sites.data?.length ?? 0,
    mrrCents: mrr,
    arrCents: arr,
    newOrganizations: newOrgs.length,
    churnedOrganizations: churnedOrgs.length,
    planDistribution,
  };
}

export async function listOrganizationsAdmin(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("organizations")
    .select(
      `
      id, name, industry, status, created_at, last_activity_at, trial_ends_at,
      subscriptions:subscriptions!subscriptions_organization_id_fkey (
        status, plan_id, plans:plan_id ( name, code )
      )
    `,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const enriched = [];
  for (const org of data ?? []) {
    const [{ count: userCount }, { count: siteCount }] = await Promise.all([
      supabase
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .eq("status", "active"),
      supabase
        .from("sites")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .is("deleted_at", null),
    ]);

    const subs = (org.subscriptions as unknown as Array<{
      status: string;
      plans?: { name?: string; code?: string } | null;
    }>) ?? [];
    const activeSub = subs[0];

    enriched.push({
      ...org,
      users: userCount ?? 0,
      sites: siteCount ?? 0,
      planName: activeSub?.plans?.name ?? "—",
      subscriptionStatus: activeSub?.status ?? "—",
    });
  }

  return enriched;
}

export async function updateOrganizationStatus(
  supabase: SupabaseClient,
  input: {
    userId: string;
    organizationId: string;
    status: string;
    reason?: string;
  },
) {
  await assertPlatformAdmin(supabase, input.userId);
  const { data: previous } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", input.organizationId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("organizations")
    .update({ status: input.status, updated_by: input.userId })
    .eq("id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "saas.organization.status_changed",
    entityType: "organization",
    entityId: input.organizationId,
    previousValues: previous,
    newValues: data,
    reason: input.reason,
  });

  return data;
}

export async function changeOrganizationPlan(
  supabase: SupabaseClient,
  input: {
    userId: string;
    organizationId: string;
    planId: string;
    customPriceMonthlyCents?: number | null;
    customPriceYearlyCents?: number | null;
    extendTrialDays?: number;
  },
) {
  await assertPlatformAdmin(supabase, input.userId);

  const { data: current } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .in("status", ["trialing", "active", "past_due", "paused"])
    .maybeSingle();

  const trialEndsAt = input.extendTrialDays
    ? new Date(Date.now() + input.extendTrialDays * 86400000).toISOString()
    : current?.trial_ends_at ?? null;

  let subscription;
  if (current) {
    const { data, error } = await supabase
      .from("subscriptions")
      .update({
        plan_id: input.planId,
        custom_price_monthly_cents: input.customPriceMonthlyCents ?? null,
        custom_price_yearly_cents: input.customPriceYearlyCents ?? null,
        trial_ends_at: trialEndsAt,
        status: trialEndsAt && new Date(trialEndsAt) > new Date() ? "trialing" : "active",
        updated_by: input.userId,
      })
      .eq("id", current.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    subscription = data;
  } else {
    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        organization_id: input.organizationId,
        plan_id: input.planId,
        status: "active",
        custom_price_monthly_cents: input.customPriceMonthlyCents ?? null,
        custom_price_yearly_cents: input.customPriceYearlyCents ?? null,
        trial_ends_at: trialEndsAt,
        created_by: input.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    subscription = data;
  }

  await supabase.from("subscription_events").insert({
    organization_id: input.organizationId,
    subscription_id: subscription.id,
    event_type: "plan_changed",
    from_plan_id: current?.plan_id ?? null,
    to_plan_id: input.planId,
    created_by: input.userId,
    payload: {
      custom_price_monthly_cents: input.customPriceMonthlyCents ?? null,
      extend_trial_days: input.extendTrialDays ?? null,
    },
  });

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "saas.subscription.plan_changed",
    entityType: "subscription",
    entityId: subscription.id,
    previousValues: current,
    newValues: subscription,
  });

  return subscription;
}

export async function upsertFeatureOverride(
  supabase: SupabaseClient,
  input: {
    userId: string;
    organizationId: string;
    featureId: string;
    enabled?: boolean | null;
    limitValue?: number | null;
    unlimited?: boolean;
    isTemporary?: boolean;
    endsAt?: string | null;
    reason?: string;
  },
) {
  await assertPlatformAdmin(supabase, input.userId);

  const { data, error } = await supabase
    .from("organization_feature_overrides")
    .insert({
      organization_id: input.organizationId,
      feature_id: input.featureId,
      enabled: input.enabled ?? true,
      limit_value: input.limitValue ?? null,
      unlimited: input.unlimited ?? false,
      is_temporary: input.isTemporary ?? false,
      ends_at: input.endsAt ?? null,
      reason: input.reason ?? null,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "saas.feature_override.upserted",
    entityType: "organization_feature_override",
    entityId: data.id,
    newValues: data,
    reason: input.reason,
  });

  return data;
}
