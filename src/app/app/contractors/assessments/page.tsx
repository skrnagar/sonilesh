import Link from "next/link";
import { createContractorAssessmentAction } from "@/app/actions/contractors";
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

export default async function ContractorAssessmentsPage() {
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
      .from("contractor_assessments")
      .select("id, title, status, score_percent, checklist_assignment_id, contractor_companies:company_id(name)")
      .eq("organization_id", access.organization.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Assessments</h1>
        <p className="text-sm text-muted-foreground">
          Each assessment is a checklist assignment (`contractor` type). Conduct it in the checklist
          runner — findings can still feed CAPA.
        </p>
      </div>
      <ContractorsNav current="/app/contractors/assessments" />
      <ActionForm
        action={createContractorAssessmentAction}
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
          <Label>Template</Label>
          <Select name="templateId" required defaultValue={templates[0]?.id ?? ""}>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Title</Label>
          <Input name="title" required defaultValue="Contractor assessment" />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={!templates.length}>
            Create & open
          </Button>
        </div>
      </ActionForm>
      <RecordsTable
        columns={["Company", "Title", "Status", "Score", "Checklist"]}
        empty="No assessments."
        rows={(rows ?? []).map((row) => [
          (row.contractor_companies as { name?: string } | null)?.name ?? "—",
          row.title,
          <StatusPill key="s" value={row.status} />,
          row.score_percent ?? "—",
          <Link key="l" href={`/app/inspections/${row.checklist_assignment_id}`} className="underline">
            Open
          </Link>,
        ])}
      />
    </div>
  );
}
