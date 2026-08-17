import { PlanFeatureMatrix } from "@/components/admin/plan-feature-matrix";
import { requirePlatformPermission } from "@/lib/auth/session";
import { canManagePlans } from "@/lib/auth/platform";

export default async function AdminEntitlementsPage() {
  const { supabase, platformRole } = await requirePlatformPermission("saas.entitlements.view");
  const [{ data: plans }, { data: features }, { data: cells }] = await Promise.all([
    supabase
      .from("plans")
      .select("id, name, code")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("features")
      .select("id, code, name, catalog_group")
      .eq("is_active", true)
      .order("name"),
    supabase.from("plan_features").select("plan_id, feature_id, enabled, limit_value"),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Plan feature matrix</h1>
        <p className="text-sm text-muted-foreground">
          Values come from Supabase. Toggling a cell updates `plan_features` without a code change.
        </p>
      </div>
      <PlanFeatureMatrix
        plans={plans ?? []}
        features={features ?? []}
        cells={(cells ?? []).map((row) => ({
          planId: row.plan_id,
          featureId: row.feature_id,
          enabled: Boolean(row.enabled),
          limitValue: row.limit_value == null ? null : Number(row.limit_value),
        }))}
        canEdit={canManagePlans(platformRole)}
      />
    </div>
  );
}
