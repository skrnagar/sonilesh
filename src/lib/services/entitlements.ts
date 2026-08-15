import type { SupabaseClient } from "@supabase/supabase-js";
import type { EntitlementResult, LimitCheckResult } from "@/types/database";

type FeatureRow = {
  id: string;
  code: string;
  value_type: "boolean" | "numeric" | "unlimited";
};

const ACTIVE_SUB_STATUSES = ["trialing", "active", "past_due", "paused"] as const;

async function getFeature(
  supabase: SupabaseClient,
  featureCode: string,
): Promise<FeatureRow | null> {
  const { data, error } = await supabase
    .from("features")
    .select("id, code, value_type")
    .eq("code", featureCode)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function resolveEntitlement(
  supabase: SupabaseClient,
  organizationId: string,
  featureCode: string,
): Promise<EntitlementResult> {
  const feature = await getFeature(supabase, featureCode);
  if (!feature) {
    return { enabled: false, unlimited: false, limitValue: null, source: "default" };
  }

  const nowIso = new Date().toISOString();
  const [{ data: override }, { data: subscription }] = await Promise.all([
    supabase
      .from("organization_feature_overrides")
      .select("enabled, limit_value, unlimited, ends_at, is_temporary")
      .eq("organization_id", organizationId)
      .eq("feature_id", feature.id)
      .lte("starts_at", nowIso)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("id, plan_id, status")
      .eq("organization_id", organizationId)
      .in("status", [...ACTIVE_SUB_STATUSES])
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  if (override && (!override.ends_at || override.ends_at >= nowIso)) {
    return {
      enabled: override.enabled ?? true,
      unlimited: override.unlimited,
      limitValue: override.limit_value === null ? null : Number(override.limit_value),
      source: "override",
    };
  }

  if (!subscription) {
    return { enabled: false, unlimited: false, limitValue: null, source: "default" };
  }

  const { data: planFeature } = await supabase
    .from("plan_features")
    .select("enabled, limit_value, unlimited")
    .eq("plan_id", subscription.plan_id)
    .eq("feature_id", feature.id)
    .maybeSingle();

  if (!planFeature) {
    return { enabled: false, unlimited: false, limitValue: null, source: "default" };
  }

  return {
    enabled: planFeature.enabled,
    unlimited: planFeature.unlimited,
    limitValue:
      planFeature.limit_value === null || planFeature.limit_value === undefined
        ? null
        : Number(planFeature.limit_value),
    source: "plan",
  };
}

export async function hasFeature(
  supabase: SupabaseClient,
  organizationId: string,
  featureCode: string,
) {
  const entitlement = await resolveEntitlement(supabase, organizationId, featureCode);
  return entitlement.enabled;
}

export async function getLimit(
  supabase: SupabaseClient,
  organizationId: string,
  featureCode: string,
): Promise<number | null> {
  const entitlement = await resolveEntitlement(supabase, organizationId, featureCode);
  if (!entitlement.enabled) return 0;
  if (entitlement.unlimited) return null;
  return entitlement.limitValue;
}

export async function checkLimit(
  supabase: SupabaseClient,
  organizationId: string,
  featureCode: string,
  requestedUsage: number,
): Promise<LimitCheckResult> {
  const entitlement = await resolveEntitlement(supabase, organizationId, featureCode);
  if (!entitlement.enabled) {
    return { allowed: false, remaining: 0, limit: 0, unlimited: false };
  }
  if (entitlement.unlimited || entitlement.limitValue === null) {
    return { allowed: true, remaining: null, limit: null, unlimited: true };
  }

  const feature = await getFeature(supabase, featureCode);
  let currentUsage = 0;

  if (feature) {
    const periodStart = new Date();
    periodStart.setUTCDate(1);
    const periodEnd = new Date(periodStart);
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
    periodEnd.setUTCDate(0);

    const { data: metric } = await supabase
      .from("usage_metrics")
      .select("usage_value")
      .eq("organization_id", organizationId)
      .eq("feature_id", feature.id)
      .eq("period_start", periodStart.toISOString().slice(0, 10))
      .maybeSingle();

    currentUsage = Number(metric?.usage_value ?? 0);
  }

  if (featureCode === "max_users") {
    const { count } = await supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .is("deleted_at", null);
    currentUsage = count ?? 0;
  }
  if (featureCode === "max_sites") {
    const { count } = await supabase
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null);
    currentUsage = count ?? 0;
  }
  if (featureCode === "max_projects") {
    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null);
    currentUsage = count ?? 0;
  }

  const remaining = entitlement.limitValue - currentUsage;
  return {
    allowed: remaining >= requestedUsage,
    remaining: Math.max(remaining, 0),
    limit: entitlement.limitValue,
    unlimited: false,
  };
}

export async function requireFeature(
  supabase: SupabaseClient,
  organizationId: string,
  featureCode: string,
) {
  const ok = await hasFeature(supabase, organizationId, featureCode);
  if (!ok) {
    throw new Error(`Feature not entitled: ${featureCode}`);
  }
}

/**
 * Batched entitlement resolution for sidebar/nav.
 * Avoids N×(feature+override+subscription+plan) round-trips.
 */
export async function listEnabledFeatures(
  supabase: SupabaseClient,
  organizationId: string,
) {
  const nowIso = new Date().toISOString();

  const [
    { data: features, error },
    { data: subscription },
    { data: overrides },
  ] = await Promise.all([
    supabase
      .from("features")
      .select("id, code, category, value_type")
      .eq("is_active", true),
    supabase
      .from("subscriptions")
      .select("id, plan_id, status")
      .eq("organization_id", organizationId)
      .in("status", [...ACTIVE_SUB_STATUSES])
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("organization_feature_overrides")
      .select("feature_id, enabled, ends_at, starts_at")
      .eq("organization_id", organizationId)
      .lte("starts_at", nowIso)
      .order("starts_at", { ascending: false }),
  ]);

  if (error) throw new Error(error.message);

  const candidates = (features ?? []).filter(
    (feature) => !(feature.value_type !== "boolean" && feature.category === "limit"),
  );

  if (!candidates.length) return [] as string[];

  const latestOverride = new Map<
    string,
    { enabled: boolean | null; ends_at: string | null }
  >();
  for (const row of overrides ?? []) {
    if (latestOverride.has(row.feature_id)) continue;
    latestOverride.set(row.feature_id, {
      enabled: row.enabled,
      ends_at: row.ends_at,
    });
  }

  const planFeatureById = new Map<string, { enabled: boolean }>();
  if (subscription?.plan_id) {
    const { data: planFeatures, error: planError } = await supabase
      .from("plan_features")
      .select("feature_id, enabled")
      .eq("plan_id", subscription.plan_id);
    if (planError) throw new Error(planError.message);
    for (const pf of planFeatures ?? []) {
      planFeatureById.set(pf.feature_id, { enabled: pf.enabled });
    }
  }

  const enabled: string[] = [];
  for (const feature of candidates) {
    const override = latestOverride.get(feature.id);
    if (override && (!override.ends_at || override.ends_at >= nowIso)) {
      if (override.enabled ?? true) enabled.push(feature.code);
      continue;
    }
    const planFeature = planFeatureById.get(feature.id);
    if (planFeature?.enabled) enabled.push(feature.code);
  }

  return enabled;
}
