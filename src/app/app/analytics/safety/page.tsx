import { AnalyticsFilterBar } from "@/components/analytics/filter-bar";
import { AnalyticsSubnav } from "@/components/analytics/subnav";
import { MetricGrid } from "@/components/analytics/metric-grid";
import { IncidentTrendChart, SeverityChart } from "@/components/dashboard/charts";
import { analyticsGate, loadAnalyticsAccess, loadControlTower, type AnalyticsSearch } from "@/lib/analytics/page-load";

export default async function SafetyAnalyticsPage({
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
        <h1 className="font-display text-xl font-semibold">Safety analytics</h1>
        <p className="text-sm text-muted-foreground">Incidents, near misses, UA/UC, lost-time counts. Rates need workforce hours.</p>
      </div>
      <AnalyticsSubnav current="/app/analytics/safety" />
      <AnalyticsFilterBar action="/app/analytics/safety" query={query} sites={ctx.sites} projects={ctx.projects} range={ctx.period.key} />
      <MetricGrid metrics={tower.incidents.metrics} />
      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <IncidentTrendChart data={tower.incidents.trend} />
        <SeverityChart data={tower.incidents.severitySeries} />
      </div>
    </div>
  );
}
