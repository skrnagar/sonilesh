import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { buildAnalyticsContext, collectControlTower } from "@/lib/analytics/metrics";
import type { AnalyticsQuery } from "@/lib/analytics/types";

export type AnalyticsSearch = {
  range?: string;
  siteId?: string;
  projectId?: string;
  departmentId?: string;
  businessUnitId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function loadAnalyticsAccess(
  featureCode: "advanced_analytics" | "executive_analytics",
) {
  return requireModuleAccess({
    featureCode,
    permission: "analytics.view",
  });
}

export function analyticsGate(
  access: Awaited<ReturnType<typeof loadAnalyticsAccess>>,
  featureName: string,
) {
  if (!access.entitled) return { ok: false as const, node: <UpgradeState featureName={featureName} /> };
  if (!access.permitted) return { ok: false as const, node: <ForbiddenState /> };
  return { ok: true as const, node: null };
}

export async function loadControlTower(
  access: Awaited<ReturnType<typeof loadAnalyticsAccess>>,
  search: AnalyticsSearch,
) {
  const query: AnalyticsQuery = search;
  const ctx = await buildAnalyticsContext(access.supabase, {
    organizationId: access.organization.id,
    organizationName: access.organization.name,
    userId: access.user.id,
    timezone: access.organization.timezone || "Asia/Kolkata",
    query,
    sites: access.sites,
    projects: access.projects,
  });
  const tower = await collectControlTower(ctx);
  return { ctx, tower, query };
}
