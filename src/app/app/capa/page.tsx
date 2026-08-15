import { ModuleShell } from "@/components/modules/module-shell";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getCapaDashboardStats, isCapaOverdue } from "@/lib/services/capa";

export default async function CapaPage() {
  const access = await requireModuleAccess({
    featureCode: "capa",
    permission: "capa.view",
  });
  if (!access.entitled || !access.permitted) {
    return (
      <ModuleShell title="CAPA" description="Corrective & Preventive Actions" featureCode="capa" permission="capa.view" />
    );
  }

  const stats = await getCapaDashboardStats(access.supabase, access.organization.id);
  const { data: rows } = await access.supabase
    .from("capa_items")
    .select("id, title, status, priority, due_date, source_module, owner_id")
    .eq("organization_id", access.organization.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const kpis = [
    { label: "Open", value: stats.open },
    { label: "Overdue (derived)", value: stats.overdue },
    { label: "Pending verification", value: stats.pendingVerification },
    { label: "Aging 31+", value: stats.aging.d31_plus },
  ];

  return (
    <ModuleShell
      title="CAPA"
      description="Central CAPA engine — single service for all source modules"
      featureCode="capa"
      permission="capa.view"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="border border-border bg-card px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
            <p className="mt-2 text-2xl font-semibold">{k.value}</p>
          </div>
        ))}
      </div>

      <RecordsTable
        columns={["Title", "Source", "Priority", "Due", "Status", "Flags"]}
        empty="No CAPA items yet."
        rows={(rows ?? []).map((r) => [
          r.title,
          r.source_module,
          r.priority,
          r.due_date ?? "—",
          <StatusPill key="s" value={r.status} />,
          isCapaOverdue(r.status, r.due_date) ? "OVERDUE" : "",
        ])}
      />
    </ModuleShell>
  );
}
