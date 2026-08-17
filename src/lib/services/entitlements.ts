import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EntitlementResult, LimitCheckResult } from "@/types/database";
import { billingGraceDays, isSelfHosted, selfHostFeatureCodes } from "@/lib/env";
import { mergeEntitlements } from "@/lib/entitlements/resolve";
import { countLiveMetric, resolveFeatureKeyForMetric } from "@/lib/usage/live";

type FeatureRow = {
  id: string;
  code: string;
  value_type: "boolean" | "numeric" | "unlimited";
};

const ACTIVE_SUB_STATUSES = ["trialing", "active", "paused"] as const;

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

export async function resolveEntitlement(
  supabase: SupabaseClient,
  organizationId: string,
  featureCode: string,
): Promise<EntitlementResult> {
  const resolvedCode = resolveFeatureKeyForMetric(featureCode);
  const feature = await getFeature(supabase, resolvedCode);
  if (!feature) {
    return { enabled: false, unlimited: false, limitValue: null, source: "default" };
  }

  const nowIso = new Date().toISOString();
  const [{ data: override }, { data: subscription }] = await Promise.all([
    supabase
      .from("organization_feature_overrides")
      .select("enabled, limit_value, unlimited, starts_at, ends_at")
      .eq("organization_id", organizationId)
      .eq("feature_id", feature.id)
      .lte("starts_at", nowIso)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("id, plan_id, status, current_period_end")
      .eq("organization_id", organizationId)
      .in("status", [...ACTIVE_SUB_STATUSES, "past_due"])
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  let planSlice = {
    featureCode: resolvedCode,
    enabled: false,
    limitValue: null as number | null,
    unlimited: false,
  };

  if (subscription) {
    let planOk = true;
    if (subscription.status === "past_due") {
      const graceMs = billingGraceDays() * 24 * 60 * 60 * 1000;
      const periodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end).getTime()
        : 0;
      if (!periodEnd || Date.now() > periodEnd + graceMs) {
        planOk = false;
      }
    }
    if (planOk) {
      const { data: planFeature } = await supabase
        .from("plan_features")
        .select("enabled, limit_value, unlimited")
        .eq("plan_id", subscription.plan_id)
        .eq("feature_id", feature.id)
        .maybeSingle();
      if (planFeature) {
        planSlice = {
          featureCode: resolvedCode,
          enabled: Boolean(planFeature.enabled),
          unlimited: Boolean(planFeature.unlimited),
          limitValue:
            planFeature.limit_value === null || planFeature.limit_value === undefined
              ? null
              : Number(planFeature.limit_value),
        };
      }
    }
  }

  const overrideActive =
    override && (!override.ends_at || override.ends_at >= nowIso) ? override : null;
  const merged = mergeEntitlements(
    [planSlice],
    overrideActive
      ? [
          {
            featureCode: resolvedCode,
            enabled: overrideActive.enabled,
            limitValue:
              overrideActive.limit_value === null ? null : Number(overrideActive.limit_value),
            unlimited: Boolean(overrideActive.unlimited),
            startsAt: overrideActive.starts_at,
            endsAt: overrideActive.ends_at,
          },
        ]
      : [],
    nowIso,
  );
  const row = merged[0];
  return {
    enabled: row?.enabled ?? false,
    unlimited: row?.unlimited ?? false,
    limitValue: row?.limitValue ?? null,
    source: row?.source ?? "default",
  };
}

export async function hasFeature(
  supabase: SupabaseClient,
  organizationId: string,
  featureCode: string,
) {
  if (isSelfHosted()) {
    const licensed = selfHostFeatureCodes();
    if (licensed && !licensed.includes(featureCode)) return false;
  }
  const enabled = await listEnabledFeatures(supabase, organizationId);
  return enabled.includes(featureCode);
}

export class UpgradeRequiredError extends Error {
  featureCode: string;
  constructor(featureCode: string) {
    super(`Upgrade required to use this module (${featureCode}).`);
    this.name = "UpgradeRequiredError";
    this.featureCode = featureCode;
  }
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

  const resolvedCode = resolveFeatureKeyForMetric(featureCode);
  const feature = await getFeature(supabase, resolvedCode);
  let currentUsage = 0;

  const live = await countLiveMetric(supabase, organizationId, resolvedCode);
  if (live != null) {
    currentUsage = live;
  } else if (feature) {
    const periodStart = new Date();
    periodStart.setUTCDate(1);
    const { data: metric } = await supabase
      .from("usage_metrics")
      .select("usage_value")
      .eq("organization_id", organizationId)
      .eq("feature_id", feature.id)
      .eq("period_start", periodStart.toISOString().slice(0, 10))
      .maybeSingle();
    currentUsage = Number(metric?.usage_value ?? 0);
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
    throw new UpgradeRequiredError(featureCode);
  }
}

/**
 * Batched entitlement resolution for sidebar/nav.
 * Avoids N×(feature+override+subscription+plan) round-trips.
 */
export const listEnabledFeatures = cache(async function listEnabledFeatures(
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
      .select("id, plan_id, status, current_period_end")
      .eq("organization_id", organizationId)
      .in("status", [...ACTIVE_SUB_STATUSES, "past_due"])
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
  let planId = subscription?.plan_id as string | undefined;
  if (subscription?.status === "past_due") {
    const graceMs = billingGraceDays() * 24 * 60 * 60 * 1000;
    const periodEnd = (subscription as { current_period_end?: string }).current_period_end
      ? new Date((subscription as { current_period_end?: string }).current_period_end as string).getTime()
      : 0;
    if (!periodEnd || Date.now() > periodEnd + graceMs) {
      planId = undefined;
    }
  }
  if (planId) {
    const { data: planFeatures, error: planError } = await supabase
      .from("plan_features")
      .select("feature_id, enabled")
      .eq("plan_id", planId);
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

  if (isSelfHosted()) {
    const licensed = selfHostFeatureCodes();
    if (licensed) return enabled.filter((code) => licensed.includes(code));
  }

  return enabled;
});
