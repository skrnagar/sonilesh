import { AnalyticsFilterBar } from "@/components/analytics/filter-bar";
import { HealthScoreCard } from "@/components/analytics/health-score-card";
import { MetricGrid } from "@/components/analytics/metric-grid";
import { AlertsList, DataQualityList } from "@/components/analytics/alerts-list";
import { ExecutiveSubnav } from "@/components/analytics/subnav";
import { IncidentTrendChart } from "@/components/dashboard/charts";
import { analyticsGate, loadAnalyticsAccess, loadControlTower, type AnalyticsSearch } from "@/lib/analytics/page-load";
import Link from "next/link";

export default async function ExecutiveControlTowerPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearch>;
}) {
  const search = await searchParams;
  const access = await loadAnalyticsAccess("executive_analytics");
  const gate = analyticsGate(access, "Executive analytics");
  if (!gate.ok) return gate.node;

  const { ctx, tower, query } = await loadControlTower(access, search);
  const top = [
    "incident_count",
    "critical_incidents",
    "open_capa",
    "overdue_capa",
    "high_residual_risk",
    "inspection_completion",
    "compliance_overdue",
    "training_overdue",
  ];
  const cards = tower.metrics.filter((m) => top.includes(m.code));

  return (
    <div className="min-w-0 space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mkt-safety)]">
          Executive
        </p>
        <h1 className="mt-1 font-display text-xl font-semibold sm:text-2xl">EHS Control Tower</h1>
        <p className="text-sm text-muted-foreground">
          {ctx.organizationName} · {ctx.period.label} in {ctx.timezone}. Aggregates use accessible
          records only — site-scoped users do not see other sites.
        </p>
      </div>
      <ExecutiveSubnav current="/app/executive" />
      <AnalyticsFilterBar
        action="/app/executive"
        query={query}
        sites={ctx.sites}
        projects={ctx.projects}
        departments={ctx.departments}
        bus={ctx.bus}
        range={ctx.period.key}
      />
      <HealthScoreCard health={tower.health} />
      <MetricGrid metrics={cards} />
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Period summaries</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {tower.summaries.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <IncidentTrendChart data={tower.incidents.trend} />
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Alerts</h2>
          <AlertsList alerts={tower.alerts} />
        </div>
      </div>
      <DataQualityList flags={tower.flags} />
      <p className="text-sm">
        Compliance filings:{" "}
        <Link className="underline" href="/app/executive/compliance">
          Executive compliance
        </Link>
        {" · "}
        <Link className="underline" href="/app/alerts">
          All alerts
        </Link>
      </p>
    </div>
  );
}
