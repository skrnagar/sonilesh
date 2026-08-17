import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { saveEsgMetricAction } from "@/app/actions/esg";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { computeEmployeeHealthSafetyFromIncidents, listMetricDefinitions } from "@/lib/services/esg";

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

  const [{ data: metrics }, liveSafety, definitions] = await Promise.all([
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
    listMetricDefinitions(access.supabase, access.organization.id),
  ]);

  const byKey = new Map((metrics ?? []).map((row) => [row.metric_key, row]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">ESG metrics</h1>
        <p className="text-sm text-muted-foreground">
          Definitions come from the configured catalog. Employee health & safety for FY {fy} is{" "}
          <strong>{liveSafety.incident_count} incident(s)</strong> from EHS — not a typed-in score.
        </p>
      </div>
      <div className="space-y-4">
        {definitions.map((metric) => {
          const stored = byKey.get(metric.code);
          const isSafety = metric.code === "employee_health_safety";
          return (
            <ActionForm
              key={metric.code}
              action={saveEsgMetricAction}
              className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4"
            >
              <input type="hidden" name="metricKey" value={metric.code} />
              <input type="hidden" name="period" value={fy} />
              <input type="hidden" name="periodStart" value={periodStart} />
              <input type="hidden" name="periodEnd" value={periodEnd} />
              <input type="hidden" name="unit" value={metric.unit ?? ""} />
              <div className="md:col-span-4">
                <p className="font-medium">{metric.name}</p>
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
        {!definitions.length ? (
          <p className="text-sm text-muted-foreground">No metric definitions in the catalog yet.</p>
        ) : null}
      </div>
    </div>
  );
}
