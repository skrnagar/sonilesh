import { AnalyticsFilterBar } from "@/components/analytics/filter-bar";
import { AnalyticsSubnav } from "@/components/analytics/subnav";
import { MetricGrid } from "@/components/analytics/metric-grid";
import { IncidentTrendChart, SeverityChart } from "@/components/dashboard/charts";
import { analyticsGate, loadAnalyticsAccess, loadControlTower, type AnalyticsSearch } from "@/lib/analytics/page-load";

export default async function AnalyticsOverviewPage({
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
        <h1 className="font-display text-xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Same metric services as the Control Tower. Periods use {ctx.timezone}.
        </p>
      </div>
      <AnalyticsSubnav current="/app/analytics" />
      <AnalyticsFilterBar
        action="/app/analytics"
        query={query}
        sites={ctx.sites}
        projects={ctx.projects}
        departments={ctx.departments}
        bus={ctx.bus}
        range={ctx.period.key}
      />
      <MetricGrid metrics={tower.metrics.slice(0, 8)} />
      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <IncidentTrendChart data={tower.incidents.trend} />
        <SeverityChart data={tower.incidents.severitySeries} />
      </div>
    </div>
  );
}
