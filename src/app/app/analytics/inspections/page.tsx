import { AnalyticsFilterBar } from "@/components/analytics/filter-bar";
import { AnalyticsSubnav } from "@/components/analytics/subnav";
import { MetricGrid } from "@/components/analytics/metric-grid";
import { StatusBars } from "@/components/analytics/status-bars";
import { analyticsGate, loadAnalyticsAccess, loadControlTower, type AnalyticsSearch } from "@/lib/analytics/page-load";

export default async function InspectionAnalyticsPage({
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
        <h1 className="font-display text-xl font-semibold">Inspection &amp; audit analytics</h1>
        <p className="text-sm text-muted-foreground">Completion and open findings from checklist assignments.</p>
      </div>
      <AnalyticsSubnav current="/app/analytics/inspections" />
      <AnalyticsFilterBar action="/app/analytics/inspections" query={query} sites={ctx.sites} projects={ctx.projects} range={ctx.period.key} />
      <MetricGrid metrics={[...tower.inspections.metrics, ...tower.audits.metrics]} />
      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <StatusBars title="Inspection status" empty="No inspections." data={tower.inspections.byStatus} />
        <StatusBars title="Audit status" empty="No audits." data={tower.audits.byStatus} />
      </div>
    </div>
  );
}
