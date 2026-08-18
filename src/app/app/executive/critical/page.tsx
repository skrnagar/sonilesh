import { AnalyticsFilterBar } from "@/components/analytics/filter-bar";
import { AlertsList } from "@/components/analytics/alerts-list";
import { MetricGrid } from "@/components/analytics/metric-grid";
import { ExecutiveSubnav } from "@/components/analytics/subnav";
import { analyticsGate, loadAnalyticsAccess, loadControlTower, type AnalyticsSearch } from "@/lib/analytics/page-load";

export default async function ExecutiveCriticalPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearch>;
}) {
  const search = await searchParams;
  const access = await loadAnalyticsAccess("executive_analytics");
  const gate = analyticsGate(access, "Executive analytics");
  if (!gate.ok) return gate.node;
  const { ctx, tower, query } = await loadControlTower(access, search);
  const critical = tower.metrics.filter(
    (m) => m.tone === "critical" || (m.polarity === "higher-is-worse" && (m.value ?? 0) > 0 && ["overdue_capa", "critical_incidents", "expired_licenses", "compliance_overdue"].includes(m.code)),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold">Critical signals</h1>
        <p className="text-sm text-muted-foreground">
          Items that need leadership attention in this scope. Drill-through opens the source module, not a copy of the register.
        </p>
      </div>
      <ExecutiveSubnav current="/app/executive/critical" />
      <AnalyticsFilterBar
        action="/app/executive/critical"
        query={query}
        sites={ctx.sites}
        projects={ctx.projects}
        range={ctx.period.key}
      />
      <MetricGrid metrics={critical} />
      <AlertsList alerts={tower.alerts.filter((a) => a.severity === "critical")} />
    </div>
  );
}
