import { ModuleShell } from "@/components/modules/module-shell";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function AuditsPage() {
  const access = await requireModuleAccess({
    featureCode: "audits",
    permission: "audits.view",
  });
  if (!access.entitled || !access.permitted) {
    return (
      <ModuleShell title="Audits" description="Audit program" featureCode="audits" permission="audits.view" />
    );
  }

  const { data: assignments } = await access.supabase
    .from("checklist_assignments")
    .select("assignment_number, title, status, scheduled_for, score_percent")
    .eq("organization_id", access.organization.id)
    .eq("checklist_type", "audit")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: categories } = await access.supabase
    .from("finding_categories")
    .select("code, name")
    .or(`organization_id.eq.${access.organization.id},organization_id.is.null`);

  return (
    <ModuleShell
      title="Audits"
      description="Shared checklist engine (type=audit). Finding categories are configurable."
      featureCode="audits"
      permission="audits.view"
    >
      <p className="text-sm text-muted-foreground">
        Finding categories: {(categories ?? []).map((c) => c.name).join(", ") || "Major / Minor / Observation (seed)"}
      </p>
      <RecordsTable
        columns={["Number", "Title", "Status", "Planned", "Score"]}
        empty="No audit assignments yet."
        rows={(assignments ?? []).map((r) => [
          r.assignment_number,
          r.title,
          <StatusPill key="s" value={r.status} />,
          r.scheduled_for ?? "—",
          r.score_percent != null ? `${r.score_percent}%` : "—",
        ])}
      />
    </ModuleShell>
  );
}
