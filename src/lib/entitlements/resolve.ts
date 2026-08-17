export type PlanFeatureSlice = {
  featureCode: string;
  enabled: boolean;
  limitValue: number | null;
  unlimited: boolean;
};

export type OverrideSlice = {
  featureCode: string;
  enabled: boolean | null;
  limitValue: number | null;
  unlimited: boolean;
  startsAt: string;
  endsAt: string | null;
};

export type EffectiveEntitlement = {
  featureCode: string;
  enabled: boolean;
  limitValue: number | null;
  unlimited: boolean;
  source: "plan" | "override" | "default";
};

export function overrideIsActive(override: OverrideSlice, nowIso = new Date().toISOString()) {
  if (override.startsAt > nowIso) return false;
  if (override.endsAt && override.endsAt < nowIso) return false;
  return true;
}

/** Base plan + latest active override = effective entitlement. */
export function mergeEntitlements(
  planFeatures: PlanFeatureSlice[],
  overrides: OverrideSlice[],
  nowIso = new Date().toISOString(),
): EffectiveEntitlement[] {
  const byCode = new Map<string, EffectiveEntitlement>();

  for (const row of planFeatures) {
    byCode.set(row.featureCode, {
      featureCode: row.featureCode,
      enabled: row.enabled,
      limitValue: row.unlimited ? null : row.limitValue,
      unlimited: row.unlimited,
      source: "plan",
    });
  }

  const latest = new Map<string, OverrideSlice>();
  const sorted = [...overrides].sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  for (const row of sorted) {
    if (!overrideIsActive(row, nowIso)) continue;
    if (latest.has(row.featureCode)) continue;
    latest.set(row.featureCode, row);
  }

  for (const [code, override] of latest) {
    const base = byCode.get(code) ?? {
      featureCode: code,
      enabled: false,
      limitValue: null,
      unlimited: false,
      source: "default" as const,
    };
    const extra = override.limitValue;
    const baseLimit = base.unlimited ? null : base.limitValue;
    const unlimited = override.unlimited || base.unlimited;
    byCode.set(code, {
      featureCode: code,
      enabled: override.enabled ?? base.enabled,
      unlimited,
      limitValue: unlimited
        ? null
        : extra != null && baseLimit != null
          ? baseLimit + extra
          : extra != null
            ? extra
            : baseLimit,
      source: "override",
    });
  }

  return Array.from(byCode.values()).sort((a, b) => a.featureCode.localeCompare(b.featureCode));
}

export function checkRequestedUsage(input: {
  enabled: boolean;
  unlimited: boolean;
  limit: number | null;
  current: number;
  requested: number;
}) {
  if (!input.enabled) {
    return { allowed: false, remaining: 0, limit: 0, unlimited: false as const };
  }
  if (input.unlimited || input.limit == null) {
    return { allowed: true, remaining: null, limit: null, unlimited: true as const };
  }
  const remaining = input.limit - input.current;
  return {
    allowed: remaining >= input.requested,
    remaining: Math.max(remaining, 0),
    limit: input.limit,
    unlimited: false as const,
  };
}
