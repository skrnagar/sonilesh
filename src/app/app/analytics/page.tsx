import { NamedBarChart, IncidentTrendChart, SeverityChart } from "@/components/dashboard/charts";
import { ModuleShell } from "@/components/modules/module-shell";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getDashboardSnapshot } from "@/lib/services/dashboard";

export default async function AnalyticsPage() {
  const access = await requireModuleAccess({
    featureCode: "advanced_analytics",
    permission: "analytics.view",
  });
  if (!access.entitled || !access.permitted) {
    return (
      <ModuleShell
        title="Analytics"
        description="Advanced EHS analytics"
        featureCode="advanced_analytics"
        permission="analytics.view"
      />
    );
  }

  const snapshot = await getDashboardSnapshot(
    access.supabase,
    access.organization.id,
    access.organization.name,
    {},
  );

  return (
    <ModuleShell
      title="Analytics"
      description="Trends from the same tenant-scoped query layer as the dashboard — not demo numbers."
      featureCode="advanced_analytics"
      permission="analytics.view"
    >
      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <IncidentTrendChart data={snapshot.incidentTrend} />
        <SeverityChart data={snapshot.severitySeries} />
        <NamedBarChart
          title="CAPA aging"
          empty="No open CAPA to age."
          data={snapshot.capaAging}
          color="var(--chart-5)"
        />
        <NamedBarChart
          title="Inspection status"
          empty="No inspection assignments yet."
          data={snapshot.inspectionSeries}
          color="var(--chart-3)"
        />
      </div>
    </ModuleShell>
  );
}
