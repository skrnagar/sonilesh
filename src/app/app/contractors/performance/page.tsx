import { recordPerformanceAction } from "@/app/actions/contractors";
import { ContractorsNav } from "@/components/contractors/contractors-nav";
import { ActionForm } from "@/components/shared/action-form";
import { RecordsTable } from "@/components/modules/records-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { permissionFlags } from "@/lib/services/rbac";
import { listContractorCompanies } from "@/lib/services/contractors";

export default async function ContractorPerformancePage() {
  const access = await requireModuleAccess({
    featureCode: "contractor_management",
    permission: "contractor.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Contractor management" />;
  if (!access.permitted) return <ForbiddenState />;

  const flags = await permissionFlags(access.supabase, access.organization.id, access.user.id);
  const canUpdate = flags.hasAny(["contractor.update", "contractor.manage"]);

  const [companies, { data: rows }] = await Promise.all([
    listContractorCompanies(access.supabase, access.organization.id),
    access.supabase
      .from("contractor_performance")
      .select("id, safety_score, incidents_count, findings_count, capa_open_count, notes, contractor_companies:company_id(name)")
      .eq("organization_id", access.organization.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Performance</h1>
        <p className="text-sm text-muted-foreground">
          Period scores recorded by EHS. Incident/CAPA counts are entered here — they are not a
          second incident engine.
        </p>
      </div>
      <ContractorsNav current="/app/contractors/performance" />
      {canUpdate ? (
      <ActionForm
        action={recordPerformanceAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4"
      >
        <div className="space-y-1 md:col-span-2">
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
          <Label>Safety score</Label>
          <Input name="safetyScore" type="number" min={0} max={100} step="0.01" />
        </div>
        <div className="space-y-1">
          <Label>Open CAPA</Label>
          <Input name="capaOpenCount" type="number" min={0} />
        </div>
        <div className="space-y-1 md:col-span-4">
          <Label>Notes</Label>
          <Textarea name="notes" rows={2} />
        </div>
        <Button type="submit">Record</Button>
      </ActionForm>
      ) : null}
      <RecordsTable
        columns={["Company", "Score", "Incidents", "Findings", "Open CAPA", "Notes"]}
        empty="No performance records."
        rows={(rows ?? []).map((row) => [
          (row.contractor_companies as { name?: string } | null)?.name ?? "—",
          row.safety_score ?? "—",
          row.incidents_count,
          row.findings_count,
          row.capa_open_count,
          row.notes ?? "—",
        ])}
      />
    </div>
  );
}
