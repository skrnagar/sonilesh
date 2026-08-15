import { requirePlatformAdmin } from "@/lib/auth/session";
import { getSaaSDashboardMetrics } from "@/lib/services/admin";

export default async function AdminDashboardPage() {
  const { supabase } = await requirePlatformAdmin();
  const metrics = await getSaaSDashboardMetrics(supabase);

  const cards = [
    ["Total organizations", metrics.totalOrganizations],
    ["Active organizations", metrics.activeOrganizations],
    ["Trial organizations", metrics.trialOrganizations],
    ["Suspended organizations", metrics.suspendedOrganizations],
    ["Active users", metrics.activeUsers],
    ["Active sites", metrics.activeSites],
    ["MRR", `$${(metrics.mrrCents / 100).toLocaleString()}`],
    ["ARR", `$${(metrics.arrCents / 100).toLocaleString()}`],
    ["New organizations (MTD)", metrics.newOrganizations],
    ["Churned organizations", metrics.churnedOrganizations],
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-primary">SaaS Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Platform-level KPIs. Administrative actions are audited; tenant RLS remains enforced.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="border border-border bg-card px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Plan distribution</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {Object.entries(metrics.planDistribution).map(([plan, count]) => (
            <li key={plan} className="flex justify-between border-b border-border py-1.5">
              <span>{plan}</span>
              <span className="font-medium">{count}</span>
            </li>
          ))}
          {!Object.keys(metrics.planDistribution).length ? (
            <li className="text-muted-foreground">No subscriptions yet.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
