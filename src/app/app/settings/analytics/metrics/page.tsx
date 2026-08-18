import { SettingsNav } from "@/components/organization/settings-nav";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import Link from "next/link";

export default async function AnalyticsMetricsSettingsPage() {
  const access = await requireModuleAccess({
    featureCode: "advanced_analytics",
    permission: "analytics.manage",
  });
  if (!access.entitled) return <UpgradeState featureName="Advanced analytics" />;
  if (!access.permitted) return <ForbiddenState />;

  const { data: defs } = await access.supabase
    .from("metric_definitions")
    .select("code, name, classification, polarity, unit, formula_notes, drilldown_path")
    .is("organization_id", null)
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Metric definitions</h1>
        <p className="text-sm text-muted-foreground">
          Catalog of leading/lagging KPIs. Formulas are documented here — dashboards must not invent a second definition.
        </p>
      </div>
      <SettingsNav current="/app/settings/analytics/metrics" />
      <p className="text-sm">
        <Link className="underline" href="/app/settings/analytics/targets">
          Metric targets
        </Link>
      </p>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Class</th>
              <th className="px-3 py-2">Definition</th>
            </tr>
          </thead>
          <tbody>
            {(defs ?? []).map((d) => (
              <tr key={d.code} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{d.code}</td>
                <td className="px-3 py-2">{d.name}</td>
                <td className="px-3 py-2 capitalize">{d.classification}</td>
                <td className="px-3 py-2 text-muted-foreground">{d.formula_notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
