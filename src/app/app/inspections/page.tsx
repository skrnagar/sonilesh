import { ModuleShell } from "@/components/modules/module-shell";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function InspectionsPage() {
  const access = await requireModuleAccess({
    featureCode: "inspections",
    permission: "inspections.view",
  });
  if (!access.entitled || !access.permitted) {
    return (
      <ModuleShell title="Inspections" description="Inspection checklists" featureCode="inspections" permission="inspections.view" />
    );
  }

  const [{ data: templates }, { data: assignments }] = await Promise.all([
    access.supabase
      .from("checklist_templates")
      .select("code, name, is_active")
      .eq("organization_id", access.organization.id)
      .eq("checklist_type", "inspection")
      .is("deleted_at", null),
    access.supabase
      .from("checklist_assignments")
      .select("assignment_number, title, status, scheduled_for, score_percent")
      .eq("organization_id", access.organization.id)
      .eq("checklist_type", "inspection")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <ModuleShell
      title="Inspections"
      description="Shared checklist engine (type=inspection). Builder available to EHS Admin."
      featureCode="inspections"
      permission="inspections.view"
    >
      <div className="border border-border bg-card p-4 text-sm">
        <p className="font-semibold">Checklist templates</p>
        <p className="mt-1 text-muted-foreground">
          {(templates ?? []).length
            ? (templates ?? []).map((t) => t.name).join(", ")
            : "No templates yet — create via checklists service (tenant-specific)."}
        </p>
      </div>
      <RecordsTable
        columns={["Number", "Title", "Status", "Scheduled", "Score"]}
        empty="No inspection assignments yet."
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
