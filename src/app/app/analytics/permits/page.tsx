import { AnalyticsFilterBar } from "@/components/analytics/filter-bar";
import { AnalyticsSubnav } from "@/components/analytics/subnav";
import { MetricGrid } from "@/components/analytics/metric-grid";
import { StatusBars } from "@/components/analytics/status-bars";
import { analyticsGate, loadAnalyticsAccess, loadControlTower, type AnalyticsSearch } from "@/lib/analytics/page-load";

export default async function PermitAnalyticsPage({
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
        <h1 className="font-display text-xl font-semibold">Permit analytics</h1>
        <p className="text-sm text-muted-foreground">Live PTW counts from the permit engine. Drill to active permits.</p>
      </div>
      <AnalyticsSubnav current="/app/analytics/permits" />
      <AnalyticsFilterBar action="/app/analytics/permits" query={query} sites={ctx.sites} projects={ctx.projects} range={ctx.period.key} />
      <MetricGrid metrics={tower.permits.metrics} />
      <StatusBars title="Permit status" empty="No permits in scope." data={tower.permits.byStatus} />
    </div>
  );
}
