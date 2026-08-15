import { ModuleShell } from "@/components/modules/module-shell";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function DocumentsPage() {
  const access = await requireModuleAccess({ featureCode: "document_control", permission: "documents.view" });
  if (!access.entitled || !access.permitted) {
    return <ModuleShell title="Documents" description="Document control" featureCode="document_control" permission="documents.view" />;
  }
  const { data: rows } = await access.supabase
    .from("controlled_documents")
    .select("doc_number, title, status, current_version, expires_on")
    .eq("organization_id", access.organization.id)
    .is("deleted_at", null);
  return (
    <ModuleShell title="Document Control" description="Versioning, approval, distribution, acknowledgement" featureCode="document_control" permission="documents.view">
      <RecordsTable
        columns={["Number", "Title", "Version", "Status", "Expires"]}
        empty="No controlled documents."
        rows={(rows ?? []).map((r) => [r.doc_number, r.title, r.current_version ?? "—", <StatusPill key="s" value={r.status} />, r.expires_on ?? "—"])}
      />
    </ModuleShell>
  );
}
