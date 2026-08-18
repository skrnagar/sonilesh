import { AlertsList } from "@/components/analytics/alerts-list";
import { analyticsGate, loadAnalyticsAccess, loadControlTower, type AnalyticsSearch } from "@/lib/analytics/page-load";

export default async function AnalyticsAlertsPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearch>;
}) {
  const search = await searchParams;
  const access = await loadAnalyticsAccess("advanced_analytics");
  const gate = analyticsGate(access, "Advanced analytics");
  if (!gate.ok) return gate.node;
  const { tower } = await loadControlTower(access, search);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold">Alerts</h1>
        <p className="text-sm text-muted-foreground">
          Deduplicated by source type, source id, and alert type. Sourced from CAPA, incidents, and compliance metrics
          — not a second facts database.
        </p>
      </div>
      <AlertsList alerts={tower.alerts} />
    </div>
  );
}
