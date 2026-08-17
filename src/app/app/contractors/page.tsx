import { ModuleShell } from "@/components/modules/module-shell";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createContractorAction } from "@/app/actions/supporting";

export default async function ContractorsPage() {
  const access = await requireModuleAccess({
    featureCode: "contractor_management",
    permission: "contractors.view",
  });
  if (!access.entitled || !access.permitted) {
    return (
      <ModuleShell
        title="Contractors"
        description="Contractor management"
        featureCode="contractor_management"
        permission="contractors.view"
      />
    );
  }

  const { data: rows } = await access.supabase
    .from("contractor_companies")
    .select("name, status, safety_score, insurance_expires_on")
    .eq("organization_id", access.organization.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <ModuleShell
      title="Contractor Management"
      description="Companies, documents, induction, safety score, blacklist"
      featureCode="contractor_management"
      permission="contractors.view"
    >
      <ActionForm
        action={createContractorAction}
        className="max-w-md space-y-3 rounded-xl border border-border bg-card p-4"
      >
        <p className="text-sm font-semibold">Register company</p>
        <div className="space-y-2">
          <Label htmlFor="name">Company name</Label>
          <Input id="name" name="name" required />
        </div>
        <Button type="submit">Add contractor</Button>
      </ActionForm>
      <RecordsTable
        columns={["Company", "Status", "Safety score", "Insurance"]}
        empty="No contractors yet."
        rows={(rows ?? []).map((row) => [
          row.name,
          <StatusPill key="s" value={row.status} />,
          row.safety_score ?? "—",
          row.insurance_expires_on ?? "—",
        ])}
      />
    </ModuleShell>
  );
}
