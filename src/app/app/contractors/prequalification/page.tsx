import Link from "next/link";
import { scorePrequalificationAction, startPrequalificationAction } from "@/app/actions/contractors";
import { ContractorsNav } from "@/components/contractors/contractors-nav";
import { ActionForm } from "@/components/shared/action-form";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listTemplates } from "@/lib/services/checklists";
import { listContractorCompanies } from "@/lib/services/contractors";

export default async function PrequalificationPage() {
  const access = await requireModuleAccess({
    featureCode: "contractor_management",
    permission: "contractor.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Contractor management" />;
  if (!access.permitted) return <ForbiddenState />;

  const [companies, templates, { data: rows }] = await Promise.all([
    listContractorCompanies(access.supabase, access.organization.id),
    listTemplates(access.supabase, access.organization.id, "contractor"),
    access.supabase
      .from("contractor_prequalification")
      .select("id, status, outcome, score_percent, company_id, contractor_companies:company_id(name)")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Prequalification</h1>
        <p className="text-sm text-muted-foreground">
          Uses the checklist engine (`checklist_type=contractor`). Pass / conditional / fail come
          from org settings — not hard-coded 80/60.
        </p>
      </div>
      <ContractorsNav current="/app/contractors/prequalification" />

      <ActionForm
        action={startPrequalificationAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3"
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
          <Label>Checklist template</Label>
          <Select name="templateId" defaultValue={templates[0]?.id ?? ""}>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={!templates.length}>
            Start prequalification
          </Button>
        </div>
      </ActionForm>
      {!templates.length ? (
        <p className="text-sm text-muted-foreground">
          Create a contractor checklist template in{" "}
          <Link href="/app/settings/ehs/checklists" className="underline">
            checklist settings
          </Link>
          .
        </p>
      ) : null}

      <RecordsTable
        columns={["Company", "Status", "Outcome", "Score", "Score now"]}
        empty="No prequalification records."
        rows={(rows ?? []).map((row) => [
          (row.contractor_companies as { name?: string } | null)?.name ?? "—",
          <StatusPill key="s" value={row.status} />,
          row.outcome ?? "—",
          row.score_percent ?? "—",
          <ActionForm key={row.id} action={scorePrequalificationAction} className="flex gap-2">
            <input type="hidden" name="prequalificationId" value={row.id} />
            <input type="hidden" name="companyId" value={row.company_id} />
            <Input name="scorePercent" type="number" min={0} max={100} step="0.01" className="h-8 w-24" required />
            <Button type="submit" size="sm" variant="outline">
              Apply
            </Button>
          </ActionForm>,
        ])}
      />
    </div>
  );
}
