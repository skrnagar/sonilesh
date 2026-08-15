import { ModuleShell } from "@/components/modules/module-shell";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function ActionItemsPage() {
  const access = await requireModuleAccess({ featureCode: "capa", permission: "actions.view" });
  if (!access.entitled || !access.permitted) {
    return <ModuleShell title="Action Items" description="Action tracking" featureCode="capa" permission="actions.view" />;
  }
  const { data: rows } = await access.supabase
    .from("action_items")
    .select("title, priority, status, due_date, capa_id")
    .eq("organization_id", access.organization.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (
    <ModuleShell title="Action Items" description="Assign, evidence, escalation, optional CAPA link" featureCode="capa" permission="actions.view">
      <RecordsTable
        columns={["Title", "Priority", "Due", "Status", "CAPA"]}
        empty="No action items."
        rows={(rows ?? []).map((r) => [r.title, r.priority, r.due_date ?? "—", <StatusPill key="s" value={r.status} />, r.capa_id ? "Linked" : "—"])}
      />
    </ModuleShell>
  );
}
