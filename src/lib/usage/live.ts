import type { SupabaseClient } from "@supabase/supabase-js";

/** Maps commercial usage metrics to entitlement feature keys. */
export const METRIC_FEATURE_KEYS: Record<string, string> = {
  users: "max_users",
  sites: "max_sites",
  projects: "max_projects",
  max_users: "max_users",
  max_sites: "max_sites",
  max_projects: "max_projects",
  storage_gb: "max_storage_gb",
  documents: "document_control",
  api_calls: "api_access",
  reports: "advanced_reports",
  active_contractors: "contractor_management",
};

export function resolveFeatureKeyForMetric(metricKey: string) {
  return METRIC_FEATURE_KEYS[metricKey] ?? metricKey;
}

export function usageLimitMessage(metricKey: string) {
  const key = resolveFeatureKeyForMetric(metricKey);
  if (key === "max_users") {
    return "User limit reached. Upgrade your plan or increase your user allowance.";
  }
  if (key === "max_sites") {
    return "Site limit reached. Upgrade your plan or increase your site allowance.";
  }
  if (key === "max_projects") {
    return "Project limit reached. Upgrade your plan or increase your project allowance.";
  }
  return "Usage limit reached. Upgrade your plan or increase this allowance.";
}

export async function countLiveMetric(
  supabase: SupabaseClient,
  organizationId: string,
  metricKey: string,
) {
  const key = resolveFeatureKeyForMetric(metricKey);
  if (key === "max_users") {
    const { count } = await supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .is("deleted_at", null);
    return count ?? 0;
  }
  if (key === "max_sites") {
    const { count } = await supabase
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null);
    return count ?? 0;
  }
  if (key === "max_projects") {
    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null);
    return count ?? 0;
  }
  return null;
}

export async function getLiveUsageSnapshot(
  supabase: SupabaseClient,
  organizationId: string,
) {
  const [users, sites, projects] = await Promise.all([
    countLiveMetric(supabase, organizationId, "users"),
    countLiveMetric(supabase, organizationId, "sites"),
    countLiveMetric(supabase, organizationId, "projects"),
  ]);
  return {
    users: users ?? 0,
    sites: sites ?? 0,
    projects: projects ?? 0,
  };
}
