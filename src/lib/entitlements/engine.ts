import type { SupabaseClient } from "@supabase/supabase-js";
import {
  checkLimit,
  getLimit,
  hasFeature,
  listEnabledFeatures,
  requireFeature,
  UpgradeRequiredError,
} from "@/lib/services/entitlements";
import { mergeEntitlements, type EffectiveEntitlement } from "@/lib/entitlements/resolve";

export {
  hasFeature,
  getLimit as getFeatureLimit,
  checkLimit as checkUsageLimit,
  requireFeature,
  UpgradeRequiredError,
  listEnabledFeatures,
};

export async function getEffectivePlan(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, status, billing_interval, current_period_end, trial_ends_at, custom_price_monthly_cents, plans:plan_id(id, code, name, plan_type, price_monthly_cents, price_yearly_cents, is_custom)",
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .in("status", ["trialing", "active", "past_due", "paused"])
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getEffectiveEntitlements(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<EffectiveEntitlement[]> {
  const subscription = await getEffectivePlan(supabase, organizationId);
  const planId = (subscription?.plans as { id?: string } | null)?.id;

  const [{ data: planFeatures }, { data: overrides }, { data: features }] = await Promise.all([
    planId
      ? supabase
          .from("plan_features")
          .select("enabled, limit_value, unlimited, features:feature_id(code)")
          .eq("plan_id", planId)
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from("organization_feature_overrides")
      .select("enabled, limit_value, unlimited, starts_at, ends_at, features:feature_id(code)")
      .eq("organization_id", organizationId),
    supabase.from("features").select("code").eq("is_active", true),
  ]);

  const planSlices = (planFeatures ?? []).map((row) => ({
    featureCode: (row.features as { code?: string } | null)?.code ?? "",
    enabled: Boolean(row.enabled),
    limitValue: row.limit_value == null ? null : Number(row.limit_value),
    unlimited: Boolean(row.unlimited),
  })).filter((row) => row.featureCode);

  const overrideSlices = (overrides ?? []).map((row) => ({
    featureCode: (row.features as { code?: string } | null)?.code ?? "",
    enabled: row.enabled,
    limitValue: row.limit_value == null ? null : Number(row.limit_value),
    unlimited: Boolean(row.unlimited),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  })).filter((row) => row.featureCode);

  const merged = mergeEntitlements(planSlices, overrideSlices);
  const known = new Set((features ?? []).map((f) => f.code));
  return merged.filter((row) => known.has(row.featureCode));
}

export async function checkFeatureAccess(
  supabase: SupabaseClient,
  organizationId: string,
  featureKey: string,
) {
  const enabled = await hasFeature(supabase, organizationId, featureKey);
  return { allowed: enabled, featureKey };
}

export async function getRemainingUsage(
  supabase: SupabaseClient,
  organizationId: string,
  metricKey: string,
) {
  const result = await checkLimit(supabase, organizationId, metricKey, 0);
  return result.remaining;
}
