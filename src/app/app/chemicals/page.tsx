import { ModuleShell } from "@/components/modules/module-shell";
import { RecordsTable } from "@/components/modules/records-table";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function ChemicalsPage() {
  const access = await requireModuleAccess({ featureCode: "chemical_sds", permission: "chemicals.view" });
  if (!access.entitled || !access.permitted) {
    return <ModuleShell title="Chemicals / SDS" description="Chemical register" featureCode="chemical_sds" permission="chemicals.view" />;
  }
  const { data: rows } = await access.supabase
    .from("chemicals")
    .select("name, cas_number, hazard_classification")
    .eq("organization_id", access.organization.id)
    .is("deleted_at", null);
  return (
    <ModuleShell title="Chemical / SDS" description="Chemical master, classification, SDS versions, location" featureCode="chemical_sds" permission="chemicals.view">
      <RecordsTable
        columns={["Name", "CAS", "Classification"]}
        empty="No chemicals registered."
        rows={(rows ?? []).map((r) => [r.name, r.cas_number ?? "—", r.hazard_classification ?? "—"])}
      />
    </ModuleShell>
  );
}
