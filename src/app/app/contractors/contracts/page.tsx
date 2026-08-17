import { createContractorContractAction } from "@/app/actions/contractors";
import { ContractorsNav } from "@/components/contractors/contractors-nav";
import { ActionForm } from "@/components/shared/action-form";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listContractorCompanies } from "@/lib/services/contractors";

export default async function ContractorContractsPage() {
  const access = await requireModuleAccess({
    featureCode: "contractor_management",
    permission: "contractor.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Contractor management" />;
  if (!access.permitted) return <ForbiddenState />;

  const [companies, { data: rows }] = await Promise.all([
    listContractorCompanies(access.supabase, access.organization.id),
    access.supabase
      .from("contractor_contracts")
      .select("id, title, status, starts_on, ends_on, contract_number, contractor_companies:company_id(name)")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Contracts</h1>
        <p className="text-sm text-muted-foreground">Commercial records against contractor companies.</p>
      </div>
      <ContractorsNav current="/app/contractors/contracts" />
      <ActionForm
        action={createContractorContractAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4"
      >
        <div className="space-y-1">
          <Label>Company</Label>
          <Select name="companyId" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Title</Label>
          <Input name="title" required />
        </div>
        <div className="space-y-1">
          <Label>Number</Label>
          <Input name="contractNumber" />
        </div>
        <div className="flex items-end">
          <Button type="submit">Add contract</Button>
        </div>
      </ActionForm>
      <RecordsTable
        columns={["Company", "Title", "Number", "Status", "Ends"]}
        empty="No contracts."
        rows={(rows ?? []).map((row) => [
          (row.contractor_companies as { name?: string } | null)?.name ?? "—",
          row.title,
          row.contract_number ?? "—",
          <StatusPill key="s" value={row.status} />,
          row.ends_on ?? "—",
        ])}
      />
    </div>
  );
}
