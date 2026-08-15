import { requireOrgContext } from "@/lib/auth/org-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

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
  ]);

  const kpis = [
    { label: "Total incidents", value: totalIncidents },
    { label: "Open incidents", value: openIncidents },
    { label: "Near misses", value: nearMisses },
    { label: "Unsafe acts", value: unsafeActs },
    { label: "Unsafe conditions", value: unsafeConditions },
    { label: "Open CAPA", value: openCapa },
    { label: "Overdue CAPA", value: overdueCapa },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-primary">EHS Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Tenant-scoped KPIs for {organization.name}
          </p>
        </div>
        <form className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Select name="businessUnitId" defaultValue={params.businessUnitId || ""}>
            <option value="">All business units</option>
            {(bus ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          <Select name="siteId" defaultValue={params.siteId || ""}>
            <option value="">All sites</option>
            {(sites ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select name="projectId" defaultValue={params.projectId || ""}>
            <option value="">All projects</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select name="departmentId" defaultValue={params.departmentId || ""}>
            <option value="">All departments</option>
            {(departments ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <button className="col-span-2 h-10 rounded-md bg-primary px-3 text-sm text-primary-foreground md:col-span-4">
            Apply filters
          </button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="border border-border bg-card px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {(trendRows ?? []).map((row, idx) => (
                <div
                  key={`${row.occurred_at}-${idx}`}
                  className="flex justify-between border-b border-border py-1.5"
                >
                  <span className="text-muted-foreground">
                    {new Date(row.occurred_at).toLocaleDateString()}
                  </span>
                  <span className="font-medium capitalize">{row.status}</span>
                </div>
              ))}
              {!trendRows?.length ? (
                <p className="text-muted-foreground">
                  No events yet for this organization.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Severity & CAPA focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Open CAPA:{" "}
              <span className="font-semibold text-foreground">{openCapa}</span>
            </p>
            <p>
              Overdue CAPA:{" "}
              <span className="font-semibold text-foreground">{overdueCapa}</span>
            </p>
            <p>
              Charts expand as event volume grows. All queries are constrained by
              `organization_id` and RLS.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
