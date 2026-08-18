import { AnalyticsFilterBar } from "@/components/analytics/filter-bar";
import { AnalyticsSubnav } from "@/components/analytics/subnav";
import { MetricGrid } from "@/components/analytics/metric-grid";
import { StatusBars } from "@/components/analytics/status-bars";
import { analyticsGate, loadAnalyticsAccess, loadControlTower, type AnalyticsSearch } from "@/lib/analytics/page-load";

export default async function CapaAnalyticsPage({
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
        <h1 className="font-display text-xl font-semibold">CAPA analytics</h1>
        <p className="text-sm text-muted-foreground">
          Open/overdue from the central CAPA engine. Effectiveness is shown only when verification timestamps exist.
        </p>
      </div>
      <AnalyticsSubnav current="/app/analytics/capa" />
      <AnalyticsFilterBar action="/app/analytics/capa" query={query} sites={ctx.sites} projects={ctx.projects} range={ctx.period.key} />
      <MetricGrid metrics={tower.capa.metrics} />
      <StatusBars title="CAPA aging" empty="No open CAPA to age." data={tower.capa.aging} />
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {tower.capa.overdueItems.map((item) => (
          <li key={item.id} className="px-4 py-3 text-sm">
            <a className="font-medium hover:underline" href={item.href}>
              {item.title}
            </a>
            <p className="text-xs text-muted-foreground">
              {item.status} · due {item.due_date} · {item.priority}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
