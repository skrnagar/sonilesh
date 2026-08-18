import { AnalyticsSubnav } from "@/components/analytics/subnav";
import { DataQualityList } from "@/components/analytics/alerts-list";
import { analyticsGate, loadAnalyticsAccess, loadControlTower, type AnalyticsSearch } from "@/lib/analytics/page-load";

export default async function DataQualityPage({
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
        <h1 className="font-display text-xl font-semibold">Data quality</h1>
        <p className="text-sm text-muted-foreground">
          Gaps that would cause invented rates or black-box scores. Missing denominators withhold rates.
        </p>
      </div>
      <AnalyticsSubnav current="/app/analytics/data-quality" />
      <DataQualityList flags={tower.flags} />
    </div>
  );
}
