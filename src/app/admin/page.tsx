import { requirePlatformAdmin } from "@/lib/auth/session";
import { getSaaSDashboardMetrics } from "@/lib/services/admin";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const { supabase } = await requirePlatformAdmin();
  const metrics = await getSaaSDashboardMetrics(supabase);

  const cards = [
    {
      label: "Total organizations",
      value: metrics.totalOrganizations,
      hint: "Portfolio",
      tone: "neutral" as const,
    },
    {
      label: "Active organizations",
      value: metrics.activeOrganizations,
      hint: "Live",
      tone: "good" as const,
    },
    {
      label: "Trial organizations",
      value: metrics.trialOrganizations,
      hint: "Trial",
      tone: "watch" as const,
    },
    {
      label: "Suspended",
      value: metrics.suspendedOrganizations,
      hint: metrics.suspendedOrganizations ? "Review" : "Clear",
      tone: metrics.suspendedOrganizations ? ("critical" as const) : ("good" as const),
    },
    {
      label: "Active users",
      value: metrics.activeUsers,
      hint: "Seats",
      tone: "neutral" as const,
    },
    {
      label: "Active sites",
      value: metrics.activeSites,
      hint: "Locations",
      tone: "neutral" as const,
    },
    {
      label: "MRR",
      value: `$${(metrics.mrrCents / 100).toLocaleString()}`,
      hint: "Billing",
      tone: "neutral" as const,
    },
    {
      label: "ARR",
      value: `$${(metrics.arrCents / 100).toLocaleString()}`,
      hint: "Annual",
      tone: "neutral" as const,
    },
    {
      label: "New orgs (MTD)",
      value: metrics.newOrganizations,
      hint: "This month",
      tone: "neutral" as const,
    },
    {
      label: "Churned organizations",
      value: metrics.churnedOrganizations,
      hint: metrics.churnedOrganizations ? "Watch" : "Stable",
      tone: metrics.churnedOrganizations ? ("watch" as const) : ("good" as const),
    },
  ];

  return (
    <div className="app-page-stagger space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--mkt-safety)]">
          Platform
        </p>
        <h1 className="mt-1 font-display text-[length:var(--text-app-title)] font-semibold tracking-tight">
          SaaS dashboard
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Platform-level KPIs. Administrative actions are audited; tenant RLS remains enforced.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Plan distribution</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Plan</th>
                <th className="px-4 py-2.5 font-medium">Organizations</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metrics.planDistribution).map(([plan, count]) => (
                <tr key={plan} className="border-b border-border/80 last:border-0 hover:bg-muted/25">
                  <td className="px-4 py-2.5">{plan}</td>
                  <td className="px-4 py-2.5 font-medium tabular-nums">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!Object.keys(metrics.planDistribution).length ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No subscriptions yet.</p>
          ) : null}
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Feature adoption</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Feature</th>
                  <th className="px-4 py-2.5 font-medium">Plans enabled</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics.featureAdoption ?? {})
                  .slice(0, 12)
                  .map(([name, count]) => (
                    <tr key={name} className="border-b border-border/80 last:border-0 hover:bg-muted/25">
                      <td className="px-4 py-2 font-medium">{name}</td>
                      <td className="px-4 py-2 tabular-nums">{count}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent admin activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 text-sm">
            {(metrics.recentActivity ?? []).map((row) => (
              <p key={row.id} className="border-b border-border/80 py-2 last:border-0">
                <span className="font-medium">{row.action}</span>
                <span className="ml-2 text-xs text-muted-foreground">{row.entity_type}</span>
              </p>
            ))}
            {!metrics.recentActivity?.length ? (
              <p className="py-2 text-muted-foreground">No audited admin actions yet.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Usage alerts</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          {metrics.suspendedOrganizations || metrics.trialOrganizations ? (
            <p>
              {metrics.trialOrganizations} trial organizations and {metrics.suspendedOrganizations}{" "}
              suspended organizations need commercial review. Per-tenant usage bars live on each
              organization record (live member/site counts, not static counters).
            </p>
          ) : (
            <p>No trial or suspension alerts in the current portfolio.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
