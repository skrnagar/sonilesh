import { requireModuleAccess } from "@/lib/auth/org-context";
import { RiskMatrixVisual } from "@/components/risk/risk-matrix";
import type { RiskBand } from "@/lib/services/risk";
import { ensureDefaultMatrix } from "@/lib/services/risk";

export default async function RiskPrintPage() {
  const access = await requireModuleAccess({
    featureCode: "risk_assessment",
    permission: "risk.view",
  });
  if (!access.entitled || !access.permitted) {
    return <p className="p-6 text-sm">Not authorized</p>;
  }

  const matrix = await ensureDefaultMatrix(access.supabase, access.organization.id);
  const { data: rows } = await access.supabase
    .from("risk_assessments")
    .select("assessment_number, title, status, task_activity, residual_risk_score, residual_risk_band")
    .eq("organization_id", access.organization.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-3xl space-y-6 bg-white p-8 text-black print:p-0">
      <header className="border-b border-neutral-300 pb-4">
        <h1 className="text-2xl font-semibold">Risk Assessment Register</h1>
        <p className="text-sm text-neutral-600">{access.organization.name}</p>
      </header>
      <RiskMatrixVisual
        likelihoodMax={matrix.likelihood_max}
        consequenceMax={matrix.consequence_max}
        bands={(matrix.bands ?? []) as RiskBand[]}
      />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Number</th>
            <th>Title</th>
            <th>Task</th>
            <th>Residual</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).map((r) => (
            <tr key={r.assessment_number} className="border-b border-neutral-200">
              <td className="py-2">{r.assessment_number}</td>
              <td>{r.title}</td>
              <td>{r.task_activity ?? "—"}</td>
              <td>
                {r.residual_risk_band ?? "—"} ({r.residual_risk_score ?? "—"})
              </td>
              <td className="capitalize">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
