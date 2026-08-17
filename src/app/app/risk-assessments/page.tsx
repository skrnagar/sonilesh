import Link from "next/link";
import { ActionForm } from "@/components/shared/action-form";
import { RiskMatrixVisual } from "@/components/risk/risk-matrix";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { Badge } from "@/components/ui/badge";
import { createRiskAssessmentAction } from "@/app/actions/risk";
import { requireModuleAccess } from "@/lib/auth/org-context";
import {
  ensureDefaultMatrix,
  listRiskAssessments,
  type RiskBand,
} from "@/lib/services/risk";

export default async function RiskAssessmentsPage() {
  const access = await requireModuleAccess({
    featureCode: "risk_assessment",
    permission: "risk.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Risk Assessment" />;
  if (!access.permitted) return <ForbiddenState />;

  const matrix = await ensureDefaultMatrix(access.supabase, access.organization.id);
  const rows = await listRiskAssessments(access.supabase, access.organization.id, {
    typeCode: "risk_assessment",
  });

  const { data: sites } = await access.supabase
    .from("sites")
    .select("id, name")
    .eq("organization_id", access.organization.id)
    .is("deleted_at", null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Risk Assessments</h1>
          <p className="text-sm text-muted-foreground">
            Shared risk engine — Activity → Hazards → Controls → Residual → Approval → Review.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/risk-register">Risk register</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/settings/ehs/risk-matrix">Matrix settings</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/jsa">JSA</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/jha">JHA</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Organization risk matrix</h2>
        <RiskMatrixVisual
          likelihoodMax={matrix.likelihood_max}
          consequenceMax={matrix.consequence_max}
          bands={(matrix.bands ?? []) as RiskBand[]}
          likelihoodLabels={(matrix.likelihood_labels as string[]) ?? []}
          consequenceLabels={(matrix.consequence_labels as string[]) ?? []}
        />
      </div>

      <ActionForm
        action={createRiskAssessmentAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4"
      >
        <input type="hidden" name="organizationId" value={access.organization.id} />
        <input type="hidden" name="typeCode" value="risk_assessment" />
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required placeholder="Area / activity assessment" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="siteId">Site</Label>
          <Select id="siteId" name="siteId" defaultValue="">
            <option value="">Optional</option>
            {(sites ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="nextReviewDate">Next review</Label>
          <Input id="nextReviewDate" name="nextReviewDate" type="date" />
        </div>
        <div className="space-y-1 md:col-span-4">
          <Label htmlFor="taskActivity">Activity / task</Label>
          <Input id="taskActivity" name="taskActivity" />
        </div>
        <Button type="submit" className="w-fit">
          Create assessment
        </Button>
      </ActionForm>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Number</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Inherent</th>
              <th className="px-3 py-2">Residual</th>
              <th className="px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  No risk assessments yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link
                      href={`/app/risk-assessments/${r.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {r.assessment_number}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{r.title}</td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary" className="capitalize">
                      {String(r.status).replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 capitalize">{r.inherent_risk_band ?? "—"}</td>
                  <td className="px-3 py-2 capitalize">{r.residual_risk_band ?? "—"}</td>
                  <td className="px-3 py-2">{r.assessment_date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
