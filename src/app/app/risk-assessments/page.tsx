import Link from "next/link";
import { ModuleShell } from "@/components/modules/module-shell";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { RiskMatrixVisual } from "@/components/risk/risk-matrix";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { ensureDefaultMatrix } from "@/lib/services/risk";
import type { RiskBand } from "@/lib/services/risk";
import { Button } from "@/components/ui/button";

export default async function RiskAssessmentsPage() {
  const access = await requireModuleAccess({
    featureCode: "risk_assessment",
    permission: "risk.view",
  });

  if (!access.entitled || !access.permitted) {
    return (
      <ModuleShell
        title="Risk Assessments"
        description="Task and area risk assessments"
        featureCode="risk_assessment"
        permission="risk.view"
      />
    );
  }

  const { supabase, organization } = access;
  const matrix = await ensureDefaultMatrix(supabase, organization.id);
  const { data: rows } = await supabase
    .from("risk_assessments")
    .select("id, assessment_number, title, status, residual_risk_band, assessment_date")
    .eq("organization_id", organization.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <ModuleShell
      title="Risk Assessments"
      description="Configurable risk engine with org-specific matrix bands"
      featureCode="risk_assessment"
      permission="risk.view"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Shared engine for Risk / JSA / JHA. Matrix bands are tenant-configurable.
        </p>
        <div className="flex gap-2">
          <Link href="/app/risk-assessments/print">
            <Button variant="outline" size="sm">
              Print / export view
            </Button>
          </Link>
          <Link href="/app/jsa">
            <Button variant="outline" size="sm">
              JSA
            </Button>
          </Link>
          <Link href="/app/jha">
            <Button variant="outline" size="sm">
              JHA
            </Button>
          </Link>
        </div>
      </div>

      <div className="border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Visual risk matrix</h2>
        <RiskMatrixVisual
          likelihoodMax={matrix.likelihood_max}
          consequenceMax={matrix.consequence_max}
          bands={(matrix.bands ?? []) as RiskBand[]}
          likelihoodLabels={(matrix.likelihood_labels as string[]) ?? []}
          consequenceLabels={(matrix.consequence_labels as string[]) ?? []}
        />
      </div>

      <RecordsTable
        columns={["Number", "Title", "Status", "Residual", "Date"]}
        empty="No risk assessments yet. Create one from the service layer or upcoming create form."
        rows={(rows ?? []).map((r) => [
          r.assessment_number,
          r.title,
          <StatusPill key="s" value={r.status} />,
          r.residual_risk_band ?? "—",
          r.assessment_date,
        ])}
      />
    </ModuleShell>
  );
}
