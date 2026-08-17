import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getRiskRegister } from "@/lib/services/risk";

export default async function RiskRegisterPage() {
  const access = await requireModuleAccess({
    featureCode: "risk_assessment",
    permission: "risk.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Risk Register" />;
  if (!access.permitted) return <ForbiddenState />;

  const rows = await getRiskRegister(access.supabase, access.organization.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Risk register</h1>
          <p className="text-sm text-muted-foreground">
            Cross-assessment view of hazards sorted by residual score — feeds future PTW and CAPA.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/risk-assessments">Assessments</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Assessment</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Hazard</th>
              <th className="px-3 py-2">Inherent</th>
              <th className="px-3 py-2">Residual</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Target</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  Register empty — add hazards to assessments first.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const ra = r.risk_assessments as {
                  id?: string;
                  assessment_number?: string;
                  title?: string;
                  status?: string;
                  risk_assessment_types?: { code?: string; name?: string } | null;
                } | null;
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      {ra?.id ? (
                        <Link
                          href={`/app/risk-assessments/${ra.id}`}
                          className="font-medium text-accent hover:underline"
                        >
                          {ra.assessment_number}
                        </Link>
                      ) : (
                        "—"
                      )}
                      <p className="text-xs text-muted-foreground">{ra?.title}</p>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {ra?.risk_assessment_types?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2 max-w-xs">{r.hazard_description}</td>
                    <td className="px-3 py-2 capitalize">
                      {r.inherent_band ?? "—"}
                      {r.inherent_score != null ? ` (${r.inherent_score})` : ""}
                    </td>
                    <td className="px-3 py-2 capitalize">
                      {r.residual_band ?? "—"}
                      {r.residual_score != null ? ` (${r.residual_score})` : ""}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="secondary" className="capitalize">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{r.target_date ?? "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
