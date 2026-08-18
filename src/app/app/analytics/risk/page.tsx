import { AnalyticsFilterBar } from "@/components/analytics/filter-bar";
import { AnalyticsSubnav } from "@/components/analytics/subnav";
import { MetricGrid } from "@/components/analytics/metric-grid";
import { RiskHeatMap } from "@/components/dashboard/charts";
import { analyticsGate, loadAnalyticsAccess, loadControlTower, type AnalyticsSearch } from "@/lib/analytics/page-load";

export default async function RiskAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearch>;
}) {
  const search = await searchParams;
  const access = await loadAnalyticsAccess("advanced_analytics");
  const gate = analyticsGate(access, "Advanced analytics");
  if (!gate.ok) return gate.node;
  const { ctx, tower, query } = await loadControlTower(access, search);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold">Risk analytics</h1>
        <p className="text-sm text-muted-foreground">Residual heat from the risk register — drill to /app/risk-register.</p>
      </div>
      <AnalyticsSubnav current="/app/analytics/risk" />
      <AnalyticsFilterBar action="/app/analytics/risk" query={query} sites={ctx.sites} projects={ctx.projects} range={ctx.period.key} />
      <MetricGrid metrics={tower.risk.metrics} />
      <RiskHeatMap cells={tower.risk.heat} />
    </div>
  );
}
