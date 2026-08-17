import Link from "next/link";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { createRiskAssessmentAction } from "@/app/actions/risk";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listRiskAssessments } from "@/lib/services/risk";

export default async function JhaPage() {
  const access = await requireModuleAccess({ featureCode: "jha", permission: "risk.view" });
  if (!access.entitled) return <UpgradeState featureName="JHA" />;
  if (!access.permitted) return <ForbiddenState />;

  const rows = await listRiskAssessments(access.supabase, access.organization.id, {
    typeCode: "jha",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Job Hazard Analysis (JHA)</h1>
          <p className="text-sm text-muted-foreground">
            Shared risk engine — identify job hazards, score inherent/residual risk, apply hierarchy
            of controls, approve and review.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/risk-register">Risk register</Link>
        </Button>
      </div>

      <ActionForm
        action={createRiskAssessmentAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3"
      >
        <input type="hidden" name="organizationId" value={access.organization.id} />
        <input type="hidden" name="typeCode" value="jha" />
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required placeholder="Job hazard analysis title" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="nextReviewDate">Next review</Label>
          <Input id="nextReviewDate" name="nextReviewDate" type="date" />
        </div>
        <div className="space-y-1 md:col-span-3">
          <Label htmlFor="taskActivity">Job / activity</Label>
          <Input id="taskActivity" name="taskActivity" />
        </div>
        <Button type="submit" className="w-fit">
          Create JHA
        </Button>
      </ActionForm>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Number</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Residual</th>
              <th className="px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  No JHA records yet.
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
