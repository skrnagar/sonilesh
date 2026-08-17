import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { slugify } from "@/lib/utils";
import { getBillingProvider } from "@/lib/billing/provider";

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
    audits,
    planFeatures,
  ] = await Promise.all([
    supabase.from("organizations").select("id, status, created_at, deleted_at"),
    supabase.from("organization_members").select("id, status").eq("status", "active"),
    supabase.from("sites").select("id").is("deleted_at", null),
    supabase.from("subscriptions")
      .select("id, status, plan_id, custom_price_monthly_cents, custom_price_yearly_cents, billing_interval, plans:plan_id(code, name, price_monthly_cents, price_yearly_cents)")
      .is("deleted_at", null),
    supabase.from("audit_logs").select("id, action, entity_type, created_at, organization_id").order("created_at", { ascending: false }).limit(12),
    supabase.from("plan_features").select("enabled, features:feature_id(code, name), plans:plan_id(code)"),
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
    recentActivity: audits.data ?? [],
    featureAdoption: (() => {
      const counts: Record<string, number> = {};
      for (const row of planFeatures.data ?? []) {
        if (!row.enabled) continue;
        const code = (row.features as { code?: string; name?: string } | null)?.name
          ?? (row.features as { code?: string } | null)?.code;
        if (!code) continue;
        counts[code] = (counts[code] ?? 0) + 1;
      }
      return counts;
    })(),
  };
}

export async function listOrganizationsAdmin(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("organizations")
    .select(
      `
      id, name, industry, status, created_at, last_activity_at, trial_ends_at,
      subscriptions:subscriptions!subscriptions_organization_id_fkey (
        status, plan_id, custom_price_monthly_cents, billing_interval,
        plans:plan_id ( name, code, price_monthly_cents )
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
      custom_price_monthly_cents?: number | null;
      billing_interval?: string;
      plans?: { name?: string; code?: string; price_monthly_cents?: number } | null;
    }>) ?? [];
    const activeSub = subs[0];
    const mrrCents =
      activeSub?.custom_price_monthly_cents ??
      activeSub?.plans?.price_monthly_cents ??
      0;

    enriched.push({
      ...org,
      users: userCount ?? 0,
      sites: siteCount ?? 0,
      planName: activeSub?.plans?.name ?? "—",
      subscriptionStatus: activeSub?.status ?? "—",
      mrrCents,
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
    startsAt?: string | null;
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
      override_type: input.isTemporary ? "temporary" : "permanent",
      starts_at: input.startsAt ?? new Date().toISOString(),
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

export async function removeFeatureOverride(
  supabase: SupabaseClient,
  input: { userId: string; organizationId: string; overrideId: string; reason?: string },
) {
  await assertPlatformAdmin(supabase, input.userId);
  const { data: previous } = await supabase
    .from("organization_feature_overrides")
    .select("*")
    .eq("id", input.overrideId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  const { error } = await supabase
    .from("organization_feature_overrides")
    .delete()
    .eq("id", input.overrideId)
    .eq("organization_id", input.organizationId);
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "saas.feature_override.removed",
    entityType: "organization_feature_override",
    entityId: input.overrideId,
    previousValues: previous,
    reason: input.reason,
  });
}

export async function createOrganizationAdmin(
  supabase: SupabaseClient,
  input: {
    userId: string;
    name: string;
    legalName?: string;
    industry?: string;
    companySize?: string;
    country?: string;
    timezone?: string;
    planId: string;
    billingCycle: "monthly" | "yearly" | "custom";
    customMonthlyCents?: number | null;
    discountCents?: number;
    notes?: string;
    adminEmail?: string;
    trialDays?: number;
    extraFeatureIds?: string[];
    extraUserLimit?: number | null;
    extraSiteLimit?: number | null;
  },
) {
  await assertPlatformAdmin(supabase, input.userId);
  const slug = `${slugify(input.name) || "org"}-${Math.random().toString(36).slice(2, 6)}`;
  const { data: org, error } = await supabase
    .from("organizations")
    .insert({
      name: input.name,
      legal_name: input.legalName || null,
      slug,
      industry: input.industry || null,
      company_size: input.companySize || null,
      country: input.country || null,
      timezone: input.timezone || "Asia/Kolkata",
      status: input.trialDays ? "trial" : "active",
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("organization_settings").insert({
    organization_id: org.id,
    default_currency: "USD",
  });

  const trialEnd = input.trialDays
    ? new Date(Date.now() + input.trialDays * 86400000).toISOString()
    : null;
  const { data: plan } = await supabase
    .from("plans")
    .select("price_monthly_cents, price_yearly_cents")
    .eq("id", input.planId)
    .maybeSingle();
  const base =
    input.billingCycle === "yearly"
      ? plan?.price_yearly_cents ?? 0
      : plan?.price_monthly_cents ?? 0;
  const custom = input.customMonthlyCents ?? null;
  const discount = input.discountCents ?? 0;
  const finalPrice = Math.max((custom ?? base) - discount, 0);

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .insert({
      organization_id: org.id,
      plan_id: input.planId,
      status: trialEnd ? "trialing" : "active",
      billing_interval:
        input.billingCycle === "yearly"
          ? "yearly"
          : input.billingCycle === "custom"
            ? "custom"
            : "monthly",
      trial_start: trialEnd ? new Date().toISOString() : null,
      trial_ends_at: trialEnd,
      custom_price_monthly_cents: custom,
      base_price_cents: base,
      discount_cents: discount,
      final_price_cents: finalPrice,
      notes: input.notes ?? null,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (subError) throw new Error(subError.message);

  const billing = getBillingProvider();
  const customer = await billing.createCustomer({
    organizationId: org.id,
    email: input.adminEmail,
    name: input.name,
  });
  await supabase.from("billing_accounts").upsert(
    {
      organization_id: org.id,
      billing_email: input.adminEmail ?? null,
      provider: "manual",
      external_customer_id: customer.id,
      status: "active",
    },
    { onConflict: "organization_id" },
  );

  if (input.adminEmail) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", input.adminEmail.trim().toLowerCase())
      .maybeSingle();
    if (profile) {
      await supabase.from("organization_members").insert({
        organization_id: org.id,
        user_id: profile.id,
        status: "active",
        is_owner: true,
        created_by: input.userId,
      });
    }
  }

  const extraIds = input.extraFeatureIds ?? [];
  if (extraIds.length) {
    await supabase.from("organization_feature_overrides").insert(
      extraIds.map((featureId) => ({
        organization_id: org.id,
        feature_id: featureId,
        enabled: true,
        override_type: "contract",
        reason: "Configured at organization creation",
        created_by: input.userId,
      })),
    );
  }
  const limitCodes: Array<{ code: string; extra: number | null | undefined }> = [
    { code: "max_users", extra: input.extraUserLimit },
    { code: "max_sites", extra: input.extraSiteLimit },
  ];
  for (const item of limitCodes) {
    if (item.extra == null || Number.isNaN(item.extra)) continue;
    const { data: feature } = await supabase
      .from("features")
      .select("id")
      .eq("code", item.code)
      .maybeSingle();
    if (!feature) continue;
    await supabase.from("organization_feature_overrides").insert({
      organization_id: org.id,
      feature_id: feature.id,
      enabled: true,
      limit_value: item.extra,
      override_type: "contract",
      reason: "Limit allowance at organization creation",
      created_by: input.userId,
    });
  }

  await writeAuditLog(supabase, {
    organizationId: org.id,
    actorUserId: input.userId,
    action: "saas.organization.created",
    entityType: "organization",
    entityId: org.id,
    newValues: { name: org.name, subscriptionId: subscription.id },
  });

  return org;
}

export async function duplicatePlan(
  supabase: SupabaseClient,
  input: { userId: string; planId: string },
) {
  await assertPlatformAdmin(supabase, input.userId);
  const { data: plan, error } = await supabase.from("plans").select("*").eq("id", input.planId).single();
  if (error) throw new Error(error.message);
  const { data: copy, error: copyError } = await supabase
    .from("plans")
    .insert({
      code: `${plan.code}-copy-${Math.random().toString(36).slice(2, 5)}`,
      name: `${plan.name} (copy)`,
      description: plan.description,
      is_active: false,
      is_public: false,
      is_custom: plan.is_custom,
      sort_order: (plan.sort_order ?? 0) + 1,
      trial_days: plan.trial_days,
      price_monthly_cents: plan.price_monthly_cents,
      price_yearly_cents: plan.price_yearly_cents,
      currency: plan.currency,
    })
    .select("*")
    .single();
  if (copyError) throw new Error(copyError.message);

  const { data: features } = await supabase
    .from("plan_features")
    .select("feature_id, enabled, limit_value, unlimited")
    .eq("plan_id", input.planId);
  if (features?.length) {
    await supabase.from("plan_features").insert(
      features.map((row) => ({
        plan_id: copy.id,
        feature_id: row.feature_id,
        enabled: row.enabled,
        limit_value: row.limit_value,
        unlimited: row.unlimited,
      })),
    );
  }

  await writeAuditLog(supabase, {
    actorUserId: input.userId,
    action: "saas.plan.duplicated",
    entityType: "plan",
    entityId: copy.id,
    previousValues: { sourcePlanId: input.planId },
  });
  return copy;
}

export async function archivePlan(
  supabase: SupabaseClient,
  input: { userId: string; planId: string },
) {
  await assertPlatformAdmin(supabase, input.userId);
  const { error } = await supabase
    .from("plans")
    .update({ is_active: false, is_public: false })
    .eq("id", input.planId);
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    actorUserId: input.userId,
    action: "saas.plan.archived",
    entityType: "plan",
    entityId: input.planId,
  });
}

export async function upsertPlanFeatureCell(
  supabase: SupabaseClient,
  input: {
    userId: string;
    planId: string;
    featureId: string;
    enabled: boolean;
    limitValue?: number | null;
  },
) {
  await assertPlatformAdmin(supabase, input.userId);
  const { error } = await supabase.from("plan_features").upsert(
    {
      plan_id: input.planId,
      feature_id: input.featureId,
      enabled: input.enabled,
      limit_value: input.limitValue ?? null,
    },
    { onConflict: "plan_id,feature_id" },
  );
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    actorUserId: input.userId,
    action: "saas.plan_feature.updated",
    entityType: "plan_feature",
    newValues: input,
  });
}

export async function createCatalogFeature(
  supabase: SupabaseClient,
  input: {
    userId: string;
    code: string;
    name: string;
    description?: string;
    catalogGroup?: string;
    featureType?: string;
  },
) {
  await assertPlatformAdmin(supabase, input.userId);
  const code = input.code.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const { data, error } = await supabase
    .from("features")
    .insert({
      code,
      name: input.name,
      description: input.description ?? null,
      category: input.featureType === "limit" ? "limit" : "module",
      value_type: input.featureType === "limit" ? "numeric" : "boolean",
      catalog_group: input.catalogGroup ?? "ehs",
      feature_type: input.featureType ?? "boolean",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    actorUserId: input.userId,
    action: "saas.feature.created",
    entityType: "feature",
    entityId: data.id,
    newValues: { code: data.code, name: data.name },
  });
  return data;
}

export async function createPlan(
  supabase: SupabaseClient,
  input: {
    userId: string;
    name: string;
    code?: string;
    description?: string;
    planType?: string;
    priceMonthlyCents: number;
    priceYearlyCents: number;
    isPublic?: boolean;
    isCustom?: boolean;
  },
) {
  await assertPlatformAdmin(supabase, input.userId);
  const code = (input.code || slugify(input.name) || "plan").replace(/[^a-z0-9_]+/g, "_");
  const { data, error } = await supabase
    .from("plans")
    .insert({
      code,
      name: input.name,
      description: input.description ?? null,
      plan_type: input.planType ?? "standard",
      price_monthly_cents: input.priceMonthlyCents,
      price_yearly_cents: input.priceYearlyCents,
      is_public: input.isPublic ?? false,
      is_custom: input.isCustom ?? input.planType === "custom",
      is_active: true,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    actorUserId: input.userId,
    action: "saas.plan.created",
    entityType: "plan",
    entityId: data.id,
    newValues: { code: data.code, name: data.name },
  });
  return data;
}

export async function applySubscriptionDiscount(
  supabase: SupabaseClient,
  input: { userId: string; subscriptionId: string; discountCents: number; reason?: string },
) {
  await assertPlatformAdmin(supabase, input.userId);
  const { data: current } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", input.subscriptionId)
    .maybeSingle();
  if (!current) throw new Error("Subscription not found");
  const base = current.base_price_cents ?? current.custom_price_monthly_cents ?? 0;
  const finalPrice = Math.max(base - input.discountCents, 0);
  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      discount_cents: input.discountCents,
      final_price_cents: finalPrice,
      updated_by: input.userId,
    })
    .eq("id", input.subscriptionId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    organizationId: current.organization_id,
    actorUserId: input.userId,
    action: "saas.subscription.discount_applied",
    entityType: "subscription",
    entityId: input.subscriptionId,
    previousValues: { discount_cents: current.discount_cents },
    newValues: { discount_cents: input.discountCents, final_price_cents: finalPrice },
    reason: input.reason,
  });
  return data;
}

export async function cancelSubscriptionAdmin(
  supabase: SupabaseClient,
  input: { userId: string; subscriptionId: string; atPeriodEnd?: boolean; reason?: string },
) {
  await assertPlatformAdmin(supabase, input.userId);
  const { data: current } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", input.subscriptionId)
    .maybeSingle();
  if (!current) throw new Error("Subscription not found");
  const atPeriodEnd = Boolean(input.atPeriodEnd);
  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      cancel_at_period_end: atPeriodEnd,
      cancelled_at: atPeriodEnd ? null : new Date().toISOString(),
      status: atPeriodEnd ? current.status : "cancelled",
      updated_by: input.userId,
    })
    .eq("id", input.subscriptionId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await getBillingProvider().cancelSubscription(current.id);
  await writeAuditLog(supabase, {
    organizationId: current.organization_id,
    actorUserId: input.userId,
    action: "saas.subscription.cancelled",
    entityType: "subscription",
    entityId: input.subscriptionId,
    previousValues: { status: current.status },
    newValues: { status: data.status, cancel_at_period_end: atPeriodEnd },
    reason: input.reason,
  });
  return data;
}
