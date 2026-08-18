import { AnalyticsSubnav } from "@/components/analytics/subnav";
import { MetricGrid } from "@/components/analytics/metric-grid";
import { HealthScoreCard } from "@/components/analytics/health-score-card";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyticsGate, loadAnalyticsAccess, loadControlTower, type AnalyticsSearch } from "@/lib/analytics/page-load";
import { defaultDashboardForRoles } from "@/lib/analytics/metrics";
import { buildDrilldownHref } from "@/lib/analytics/drilldown";
import { getRoleCodesForUser } from "@/lib/auth/member-roles";
import { saveAnalyticsViewAction } from "@/app/actions/analytics";
import type { AnalyticsQuery } from "@/lib/analytics/types";

const WIDGET_SETS: Record<string, { title: string; codes: string[] }> = {
  executive_control_tower: {
    title: "Control Tower widgets",
    codes: ["incident_count", "critical_incidents", "overdue_capa", "compliance_overdue", "inspection_completion"],
  },
  site_operations: {
    title: "Site operations widgets",
    codes: ["incident_count", "open_capa", "active_permits", "inspection_completion"],
  },
  assurance: {
    title: "Assurance widgets",
    codes: ["open_findings", "overdue_capa", "high_residual_risk", "capa_effectiveness"],
  },
  field_queue: {
    title: "My work widgets",
    codes: ["open_capa", "training_overdue", "active_permits"],
  },
};

export default async function RoleDashboardsPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearch>;
}) {
  const search = await searchParams;
  const access = await loadAnalyticsAccess("advanced_analytics");
  const gate = analyticsGate(access, "Advanced analytics");
  if (!gate.ok) return gate.node;
  const { tower, query } = await loadControlTower(access, search);
  const { roleCodes } = await getRoleCodesForUser(access.supabase, access.user.id, access.organization.id);
  const code = defaultDashboardForRoles(roleCodes);
  const set = WIDGET_SETS[code] ?? WIDGET_SETS.site_operations;
  const metrics = tower.metrics.filter((m) => set.codes.includes(m.code));
  const { data: views } = await access.supabase
    .from("saved_views")
    .select("id, name, href_path, filters, is_shared, owner_user_id")
    .eq("organization_id", access.organization.id)
    .order("created_at", { ascending: false })
    .limit(40);
  const savedViews = (views ?? []) as Array<{
    id: string;
    name: string;
    href_path: string;
    filters: AnalyticsQuery | null;
    is_shared: boolean;
    owner_user_id: string;
  }>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold">Role dashboards</h1>
        <p className="text-sm text-muted-foreground">
          Default layout for your current roles ({roleCodes.join(", ") || "none"}): {set.title}. Widget types are KPI
          cards plus the optional health score — not a drag-and-drop BI studio.
        </p>
      </div>
      <AnalyticsSubnav current="/app/analytics/dashboards" />
      {code === "executive_control_tower" ? <HealthScoreCard health={tower.health} /> : null}
      <MetricGrid metrics={metrics} />

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Saved views</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Named filter sets. Shared views are visible to other org members. Layouts stay ordered lists.
        </p>
        <ActionForm action={saveAnalyticsViewAction} className="mt-3 flex flex-wrap items-end gap-3">
          <Label>
            Name
            <Input name="name" required minLength={2} className="mt-1" placeholder="Plant A this month" />
          </Label>
          <input type="hidden" name="hrefPath" value="/app/analytics" />
          <input type="hidden" name="range" value={query.range || "month"} />
          <input type="hidden" name="siteId" value={query.siteId || ""} />
          <input type="hidden" name="projectId" value={query.projectId || ""} />
          <input type="hidden" name="departmentId" value={query.departmentId || ""} />
          <input type="hidden" name="businessUnitId" value={query.businessUnitId || ""} />
          <input type="hidden" name="dateFrom" value={query.dateFrom || ""} />
          <input type="hidden" name="dateTo" value={query.dateTo || ""} />
          <Label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="shared" />
            Share with org
          </Label>
          <Button type="submit">Save current filters</Button>
        </ActionForm>
        <ul className="mt-4 divide-y divide-border">
          {savedViews.map((view) => (
            <li key={view.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <a className="font-medium hover:underline" href={buildDrilldownHref(view.href_path, view.filters ?? {})}>
                {view.name}
              </a>
              <span className="text-xs text-muted-foreground">
                {view.is_shared ? "Shared" : "Private"}
              </span>
            </li>
          ))}
          {savedViews.length === 0 ? (
            <li className="py-2 text-sm text-muted-foreground">No saved views yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
