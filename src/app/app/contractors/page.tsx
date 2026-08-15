import { ModuleShell } from "@/components/modules/module-shell";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function ContractorsPage() {
  const access = await requireModuleAccess({ featureCode: "contractor_management", permission: "contractors.view" });
  if (!access.entitled || !access.permitted) {
    return <ModuleShell title="Contractors" description="Contractor management" featureCode="contractor_management" permission="contractors.view" />;
  }
  const { data: rows } = await access.supabase
    .from("contractor_companies")
    .select("name, status, safety_score, insurance_expires_on")
    .eq("organization_id", access.organization.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (
    <ModuleShell title="Contractor Management" description="Companies, documents, induction, safety score, blacklist" featureCode="contractor_management" permission="contractors.view">
      <RecordsTable
        columns={["Company", "Status", "Safety score", "Insurance"]}
        empty="No contractors yet."
        rows={(rows ?? []).map((r) => [r.name, <StatusPill key="s" value={r.status} />, r.safety_score ?? "—", r.insurance_expires_on ?? "—"])}
      />
    </ModuleShell>
  );
}
