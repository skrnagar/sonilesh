import { AnalyticsFilterBar } from "@/components/analytics/filter-bar";
import { AnalyticsSubnav } from "@/components/analytics/subnav";
import { MetricGrid } from "@/components/analytics/metric-grid";
import { DataQualityList } from "@/components/analytics/alerts-list";
import { analyticsGate, loadAnalyticsAccess, loadControlTower, type AnalyticsSearch } from "@/lib/analytics/page-load";

export default async function WorkforceAnalyticsPage({
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
        <h1 className="font-display text-xl font-semibold">Workforce readiness</h1>
        <p className="text-sm text-muted-foreground">
          Training overdue and entered hours. Frequency rates are not calculated when hours are missing.
        </p>
      </div>
      <AnalyticsSubnav current="/app/analytics/workforce" />
      <AnalyticsFilterBar action="/app/analytics/workforce" query={query} sites={ctx.sites} projects={ctx.projects} range={ctx.period.key} />
      <MetricGrid metrics={[...tower.workforce.metrics, ...tower.training.metrics, ...tower.contractors.metrics]} />
      <DataQualityList flags={tower.flags} />
    </div>
  );
}
