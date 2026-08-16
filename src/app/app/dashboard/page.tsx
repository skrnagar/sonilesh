import { requireOrgContext } from "@/lib/auth/org-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ScopeFilters } from "@/components/dashboard/scope-filters";
import { StatusPill } from "@/components/modules/records-table";

async function countEvents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  organizationId: string,
  filters: Record<string, string | string[] | null | undefined> = {},
) {
  let query = supabase
    .from("ehs_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  for (const [key, value] of Object.entries(filters)) {
    if (value == null || value === "") continue;
    if (Array.isArray(value)) query = query.in(key, value);
    else query = query.eq(key, value);
  }
  const { count } = await query;
  return count ?? 0;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    siteId?: string;
    projectId?: string;
    departmentId?: string;
    businessUnitId?: string;
  }>;
}) {
  const params = await searchParams;
  const { supabase, organization } = await requireOrgContext();
  const orgId = organization.id;

  const scope = {
    site_id: params.siteId,
    project_id: params.projectId,
    department_id: params.departmentId,
    business_unit_id: params.businessUnitId,
  };

  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: sites },
    { data: projects },
    { data: departments },
    { data: bus },
    { data: eventTypes },
    { data: trendRows },
  ] = await Promise.all([
    supabase
      .from("sites")
      .select("id, name")
      .eq("organization_id", orgId)
      .is("deleted_at", null),
    supabase
      .from("projects")
      .select("id, name")
      .eq("organization_id", orgId)
      .is("deleted_at", null),
    supabase
      .from("departments")
      .select("id, name")
      .eq("organization_id", orgId)
      .is("deleted_at", null),
    supabase
      .from("business_units")
      .select("id, name")
      .eq("organization_id", orgId)
      .is("deleted_at", null),
    supabase.from("event_types").select("id, code").is("organization_id", null),
    supabase
      .from("ehs_events")
      .select("occurred_at, status")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false })
      .limit(8),
  ]);

  const typeId = (code: string) =>
    eventTypes?.find((t) => t.code === code)?.id ?? null;

  const [
    totalIncidents,
    openIncidents,
    nearMisses,
    unsafeActs,
    unsafeConditions,
    openCapa,
    overdueCapa,
    activePermits,
  ] = await Promise.all([
    countEvents(supabase, orgId, { ...scope, event_type_id: typeId("incident") }),
    countEvents(supabase, orgId, {
      ...scope,
      event_type_id: typeId("incident"),
      status: [
        "submitted",
        "triage",
        "investigation",
        "capa",
        "verification",
        "approval",
        "reopened",
      ],
    }),
    countEvents(supabase, orgId, { ...scope, event_type_id: typeId("near_miss") }),
    countEvents(supabase, orgId, { ...scope, event_type_id: typeId("unsafe_act") }),
    countEvents(supabase, orgId, {
      ...scope,
      event_type_id: typeId("unsafe_condition"),
    }),
    supabase
      .from("capa_items")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("status", ["open", "in_progress", "pending_verification"])
      .is("deleted_at", null)
      .then((r: { count: number | null }) => r.count ?? 0),
    supabase
      .from("capa_items")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .lt("due_date", today)
      .not("status", "in", '("closed","cancelled","verified")')
      .is("deleted_at", null)
      .then((r: { count: number | null }) => r.count ?? 0),
    supabase
      .from("permits")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("status", ["active", "authorization"])
      .is("deleted_at", null)
      .then((r: { count: number | null }) => r.count ?? 0),
  ]);

  const kpis = [
    {
      label: "Total incidents",
      value: totalIncidents,
      hint: totalIncidents === 0 ? "Clear" : "Recorded",
      tone: totalIncidents === 0 ? "good" : "neutral",
    },
    {
      label: "Open incidents",
      value: openIncidents,
      hint: openIncidents === 0 ? "Clear" : "In progress",
      tone: openIncidents === 0 ? "good" : "watch",
    },
    {
      label: "Near misses",
      value: nearMisses,
      hint: "Leading",
      tone: "neutral",
    },
    {
      label: "Unsafe acts",
      value: unsafeActs,
      hint: unsafeActs > 0 ? "Watch" : "Clear",
      tone: unsafeActs > 0 ? "watch" : "good",
    },
    {
      label: "Unsafe conditions",
      value: unsafeConditions,
      hint: unsafeConditions > 0 ? "Watch" : "Clear",
      tone: unsafeConditions > 0 ? "watch" : "good",
    },
    {
      label: "Open CAPA",
      value: openCapa,
      hint: openCapa === 0 ? "Clear" : "Open loop",
      tone: openCapa === 0 ? "good" : "watch",
    },
    {
      label: "Overdue CAPA",
      value: overdueCapa,
      hint: overdueCapa === 0 ? "On time" : "Needs action",
      tone: overdueCapa === 0 ? "good" : "critical",
    },
    {
      label: "Active permits",
      value: activePermits,
      hint: "Live work",
      tone: "neutral",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mkt-safety)]">
            Operations
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
            EHS dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Tenant-scoped control for {organization.name}
          </p>
        </div>
        <ScopeFilters
          params={params}
          sites={sites ?? []}
          projects={projects ?? []}
          departments={departments ?? []}
          bus={bus ?? []}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            hint={kpi.hint}
            tone={kpi.tone}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-2xl shadow-[var(--shadow-sm)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent events</CardTitle>
            <span className="text-xs text-muted-foreground">Latest 8</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-y border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Occurred</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(trendRows ?? []).map((row, idx) => (
                    <tr key={`${row.occurred_at}-${idx}`} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {new Date(row.occurred_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill value={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!trendRows?.length ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                No events yet for this organization.
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-[var(--shadow-sm)]">
          <CardHeader>
            <CardTitle>Closed-loop focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Open CAPA:{" "}
              <span className="font-semibold tabular-nums text-foreground">{openCapa}</span>
            </p>
            <p>
              Overdue CAPA:{" "}
              <span className="font-semibold tabular-nums text-foreground">{overdueCapa}</span>
            </p>
            <p>
              Active permits:{" "}
              <span className="font-semibold tabular-nums text-foreground">{activePermits}</span>
            </p>
            <p>
              Charts expand as event volume grows. All queries stay constrained by
              organization scope and RLS.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
