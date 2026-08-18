import { AnalyticsFilterBar } from "@/components/analytics/filter-bar";
import { AnalyticsSubnav } from "@/components/analytics/subnav";
import { StatusBars } from "@/components/analytics/status-bars";
import { analyticsGate, loadAnalyticsAccess, loadControlTower, type AnalyticsSearch } from "@/lib/analytics/page-load";

export default async function SitesAnalyticsPage({
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
        <h1 className="font-display text-xl font-semibold">Site comparison</h1>
        <p className="text-sm text-muted-foreground">
          Incident counts by accessible site only. A site user will not see other sites here.
        </p>
      </div>
      <AnalyticsSubnav current="/app/analytics/sites" />
      <AnalyticsFilterBar action="/app/analytics/sites" query={query} sites={ctx.sites} projects={ctx.projects} range={ctx.period.key} />
      <StatusBars title="Incidents by site" empty="No incidents in this period." data={tower.incidents.bySite} />
    </div>
  );
}
