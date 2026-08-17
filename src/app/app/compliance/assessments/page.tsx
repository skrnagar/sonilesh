import Link from "next/link";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { createAssessmentAction, snapshotAssessmentAction } from "@/app/actions/compliance";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listAssessments } from "@/lib/services/compliance";
import { listRequirements } from "@/lib/services/legal-register";

export default async function AssessmentsPage() {
  const access = await requireModuleAccess({
    featureCode: "regulatory_compliance",
    permission: "compliance.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Regulatory compliance" />;
  if (!access.permitted) return <ForbiddenState />;

  const [rows, requirements] = await Promise.all([
    listAssessments(access.supabase, access.organization.id, access.siteId),
    listRequirements(access.supabase, access.organization.id, access.siteId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Compliance assessments</h1>
        <p className="text-sm text-muted-foreground">
          Conducted through the checklist engine. Findings stay in Findings; CAPA is created from those
          findings. Snapshots are frozen so later applicability changes do not rewrite history.
        </p>
      </div>
      <ActionForm action={createAssessmentAction} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3">
        <div>
          <Label htmlFor="requirementId">Requirement</Label>
          <Select id="requirementId" name="requirementId" required>
            <option value="">Select</option>
            {requirements.map((row) => (
              <option key={row.id} value={row.id}>
                {row.title}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="periodLabel">Period label</Label>
          <Input id="periodLabel" name="periodLabel" required placeholder="FY2025-26" />
        </div>
        <Button type="submit" className="self-end">
          Open assessment
        </Button>
      </ActionForm>
      <ul className="divide-y rounded-2xl border border-border bg-card">
        {rows.map((row) => {
          const req = row.compliance_requirements as { title?: string } | null;
          return (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{req?.title ?? "Assessment"}</p>
                <p className="text-xs text-muted-foreground">
                  {row.period_label} · {row.status}
                  {row.score_percent != null ? ` · score ${row.score_percent}%` : ""} · findings {row.findings_count}
                </p>
              </div>
              <div className="flex gap-2">
                {row.checklist_assignment_id ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/app/inspections/${row.checklist_assignment_id}`}>Checklist</Link>
                  </Button>
                ) : null}
                <ActionForm action={snapshotAssessmentAction}>
                  <input type="hidden" name="assessmentId" value={row.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Freeze score
                  </Button>
                </ActionForm>
              </div>
            </li>
          );
        })}
        {!rows.length ? <li className="px-4 py-6 text-sm text-muted-foreground">No assessments yet.</li> : null}
      </ul>
    </div>
  );
}
