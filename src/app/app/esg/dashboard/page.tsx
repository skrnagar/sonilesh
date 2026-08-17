import Link from "next/link";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { brsrDataCoverage, listRecordedMetricsForPeriod } from "@/lib/services/esg";

export default async function EsgDashboardPage() {
  const access = await requireModuleAccess({
    featureCode: "esg",
    permission: "esg.view",
  });
  if (!access.entitled) return <UpgradeState featureName="ESG" />;
  if (!access.permitted) return <ForbiddenState />;

  const fy = `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(-2)}`;
  const [recorded, coverage, ghg] = await Promise.all([
    listRecordedMetricsForPeriod(access.supabase, access.organization.id, fy),
    brsrDataCoverage(access.supabase, access.organization.id, fy),
    access.supabase
      .from("ghg_emissions")
      .select("scope, value_tco2e")
      .eq("organization_id", access.organization.id),
  ]);

  const ghgTotals = { "1": 0, "2": 0, "3": 0 };
  for (const row of ghg.data ?? []) {
    const scope = row.scope as "1" | "2" | "3";
    ghgTotals[scope] += Number(row.value_tco2e ?? 0);
  }
  const hasGhg = (ghg.data ?? []).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">ESG dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Only metrics with recorded values are shown. Missing indicators stay blank — they are not
          scored or invented. {coverage.label}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Recorded metrics ({fy})</p>
          <p className="mt-2 text-2xl font-semibold">{recorded.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Indicator data coverage</p>
          <p className="mt-2 text-2xl font-semibold">
            {coverage.filled}/{coverage.total}
          </p>
          <p className="text-xs text-muted-foreground">{coverage.percent}% of catalog indicators with a value</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">GHG inventory (recorded)</p>
          <p className="mt-2 text-2xl font-semibold">{hasGhg ? `${ghgTotals["1"] + ghgTotals["2"]} tCO2e` : "—"}</p>
          <p className="text-xs text-muted-foreground">
            {hasGhg ? `S1 ${ghgTotals["1"]} · S2 ${ghgTotals["2"]} · S3 ${ghgTotals["3"]}` : "No GHG rows yet"}
          </p>
        </div>
      </div>
      <ul className="divide-y rounded-2xl border border-border bg-card">
        {recorded.map((row) => (
          <li key={row.metric_key} className="flex justify-between px-4 py-3 text-sm">
            <span>{row.metric_key}</span>
            <span>
              {row.value} {row.unit ?? ""} · {row.source}
            </span>
          </li>
        ))}
        {!recorded.length ? (
          <li className="px-4 py-6 text-sm text-muted-foreground">No recorded ESG metric values for this period.</li>
        ) : null}
      </ul>
      <div className="flex gap-3 text-sm">
        <Link className="underline" href="/app/esg/metrics">
          Enter metrics
        </Link>
        <Link className="underline" href="/app/esg/definitions">
          Definitions
        </Link>
        <Link className="underline" href="/app/esg/periods">
          Periods
        </Link>
      </div>
    </div>
  );
}
