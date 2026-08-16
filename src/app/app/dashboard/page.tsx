import { KpiCard } from "@/components/dashboard/kpi-card";
import { PeriodToggle } from "@/components/dashboard/period-toggle";
import { ScopeFilters } from "@/components/dashboard/scope-filters";
import {
  ContractorScoreChart,
  IncidentTrendChart,
  NamedBarChart,
  RiskHeatMap,
  SeverityChart,
} from "@/components/dashboard/charts";
import { StatusPill } from "@/components/modules/records-table";
import { EmptyState } from "@/components/shared/state-panels";
import { requireOrgContext } from "@/lib/auth/org-context";
import { getDashboardSnapshot } from "@/lib/services/dashboard";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    siteId?: string;
    projectId?: string;
    departmentId?: string;
    businessUnitId?: string;
    severityId?: string;
    status?: string;
    ownerId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const params = await searchParams;
  const { supabase, organization } = await requireOrgContext();
  const snapshot = await getDashboardSnapshot(supabase, organization.id, organization.name, params);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mkt-safety)]">
            Operations
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">EHS dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Tenant-scoped control for {organization.name}. Counts respect organization RLS.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Suspense fallback={<div className="h-9 w-48 rounded-xl border border-border bg-card" />}>
            <PeriodToggle value={snapshot.range} />
          </Suspense>
          <ScopeFilters
            params={params}
            sites={snapshot.filters.sites}
            projects={snapshot.filters.projects}
            departments={snapshot.filters.departments}
            bus={snapshot.filters.bus}
            severities={snapshot.filters.severities}
            owners={snapshot.filters.owners}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {snapshot.kpis.map((kpi) => (
          <KpiCard
            key={kpi.key}
            label={kpi.label}
            value={kpi.value}
            hint={kpi.hint}
            tone={kpi.tone}
            href={kpi.href}
            icon={kpi.icon}
            accent={kpi.accent}
            trend={kpi.trend}
            polarity={kpi.polarity}
            spark={kpi.spark}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <IncidentTrendChart data={snapshot.incidentTrend} />
        <SeverityChart data={snapshot.severitySeries} />
        <NamedBarChart
          title="Near miss vs incidents"
          empty="No events in this period."
          data={snapshot.nearMissSeries}
          color="var(--chart-2)"
        />
        <NamedBarChart
          title="CAPA aging"
          empty="No open CAPA to age."
          data={snapshot.capaAging}
          color="var(--chart-5)"
        />
        <RiskHeatMap cells={snapshot.riskHeat} />
        <NamedBarChart
          title="Inspection status"
          empty="No inspection assignments yet."
          data={snapshot.inspectionSeries}
          color="var(--chart-3)"
        />
        <NamedBarChart
          title="Training status"
          empty="No training assignments yet."
          data={snapshot.trainingSeries}
          color="var(--chart-4)"
        />
        <ContractorScoreChart data={snapshot.contractorSeries} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold tracking-tight">Recent events</h3>
            <Link href="/app/incidents" className="text-xs font-medium text-accent hover:underline">
              View incidents
            </Link>
          </div>
          {snapshot.recentEvents.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Number</th>
                    <th className="px-4 py-2.5 font-medium">Type</th>
                    <th className="px-4 py-2.5 font-medium">Title</th>
                    <th className="px-4 py-2.5 font-medium">Severity</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Occurred</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.recentEvents.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium tabular-nums">{row.event_number}</td>
                      <td className="px-4 py-3">{row.type}</td>
                      <td className="px-4 py-3 max-w-[16rem] truncate">{row.title || "—"}</td>
                      <td className="px-4 py-3">{row.severity}</td>
                      <td className="px-4 py-3">
                        <StatusPill value={row.status} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {formatDate(row.occurred_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No events yet"
              description="Incidents, near misses, and UA/UC for this organization will appear here."
            />
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold tracking-tight">Overdue CAPA</h3>
            <Link href="/app/capa" className="text-xs font-medium text-accent hover:underline">
              Open CAPA
            </Link>
          </div>
          {snapshot.overdueCapa.length ? (
            <ul className="divide-y divide-border">
              {snapshot.overdueCapa.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">Due {formatDate(item.due_date)}</p>
                  </div>
                  <StatusPill value={item.priority} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No overdue CAPA" description="Corrective actions in this tenant are on time." />
          )}
        </div>
      </div>
    </div>
  );
}
