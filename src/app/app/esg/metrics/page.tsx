import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { saveEsgMetricAction } from "@/app/actions/esg";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { BRSR_CORE_KEYS, computeEmployeeHealthSafetyFromIncidents } from "@/lib/services/esg";

export default async function EsgMetricsPage() {
  const access = await requireModuleAccess({
    featureCode: "esg_reporting",
    permission: "esg.view",
  });
  if (!access.entitled) return <UpgradeState featureName="ESG / BRSR reporting" />;
  if (!access.permitted) return <ForbiddenState />;

  const fy = `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(-2)}`;
  const periodStart = `${new Date().getFullYear() - 1}-04-01`;
  const periodEnd = `${new Date().getFullYear()}-03-31`;

  const [{ data: metrics }, liveSafety] = await Promise.all([
    access.supabase
      .from("esg_metrics")
      .select("metric_key, value, unit, notes, source")
      .eq("organization_id", access.organization.id)
      .eq("period", fy),
    computeEmployeeHealthSafetyFromIncidents(
      access.supabase,
      access.organization.id,
      periodStart,
      periodEnd,
    ),
  ]);

  const byKey = new Map((metrics ?? []).map((row) => [row.metric_key, row]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">BRSR Core metrics</h1>
        <p className="text-sm text-muted-foreground">
          Attribute 5 (Employee Health & Safety) is computed from EHS incidents for FY {fy} — currently{" "}
          <strong>{liveSafety.incident_count} incident(s)</strong>. It is not a second data-entry field.
        </p>
      </div>
      <div className="space-y-4">
        {BRSR_CORE_KEYS.map((metric) => {
          const stored = byKey.get(metric.key);
          const isSafety = metric.key === "employee_health_safety";
          return (
            <ActionForm
              key={metric.key}
              action={saveEsgMetricAction}
              className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4"
            >
              <input type="hidden" name="metricKey" value={metric.key} />
              <input type="hidden" name="period" value={fy} />
              <input type="hidden" name="periodStart" value={periodStart} />
              <input type="hidden" name="periodEnd" value={periodEnd} />
              <input type="hidden" name="unit" value={metric.unit} />
              <div className="md:col-span-4">
                <p className="font-medium">
                  Attribute {metric.attribute}: {metric.label}
                </p>
                {isSafety ? (
                  <p className="text-xs text-muted-foreground">{liveSafety.notes}</p>
                ) : null}
              </div>
              {isSafety ? (
                <p className="md:col-span-3 text-sm">
                  Live from EHS: {liveSafety.incident_count} · stored: {stored?.value ?? "not synced"}{" "}
                  ({stored?.source ?? "—"})
                </p>
              ) : (
                <>
                  <Input name="value" type="number" step="0.01" defaultValue={stored?.value ?? ""} />
                  <Input name="notes" placeholder="Notes" defaultValue={stored?.notes ?? ""} className="md:col-span-2" />
                </>
              )}
              <Button type="submit">{isSafety ? "Sync from incidents" : "Save"}</Button>
            </ActionForm>
          );
        })}
      </div>
    </div>
  );
}
