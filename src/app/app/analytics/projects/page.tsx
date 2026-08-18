import { AnalyticsFilterBar } from "@/components/analytics/filter-bar";
import { AnalyticsSubnav } from "@/components/analytics/subnav";
import { StatusBars } from "@/components/analytics/status-bars";
import { analyticsGate, loadAnalyticsAccess, loadControlTower, type AnalyticsSearch } from "@/lib/analytics/page-load";

export default async function ProjectsAnalyticsPage({
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
        <h1 className="font-display text-xl font-semibold">Project comparison</h1>
        <p className="text-sm text-muted-foreground">Incident counts by project from the same incident metric service.</p>
      </div>
      <AnalyticsSubnav current="/app/analytics/projects" />
      <AnalyticsFilterBar action="/app/analytics/projects" query={query} sites={ctx.sites} projects={ctx.projects} range={ctx.period.key} />
      <StatusBars title="Incidents by project" empty="No incidents in this period." data={tower.incidents.byProject} />
    </div>
  );
}
