import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function HeatmapPage() {
  const access = await requireModuleAccess({
    featureCode: "regulatory_compliance",
    permission: "compliance.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Regulatory compliance" />;
  if (!access.permitted) return <ForbiddenState />;

  const orgId = access.organization.id;
  const [{ data: sites }, { data: requirements }, { data: assessments }] = await Promise.all([
    access.supabase
      .from("sites")
      .select("id, name")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("name"),
    access.supabase
      .from("compliance_requirements")
      .select("id, site_id, status")
      .eq("organization_id", orgId),
    access.supabase
      .from("compliance_assessments")
      .select("id, site_id, status, findings_count")
      .eq("organization_id", orgId),
  ]);

  const cells = (sites ?? []).map((site) => {
    const reqs = (requirements ?? []).filter((r) => r.site_id === site.id);
    const asmt = (assessments ?? []).filter((a) => a.site_id === site.id);
    const open = reqs.filter((r) => r.status !== "closed" && r.status !== "not_applicable").length;
    const findings = asmt.reduce((sum, a) => sum + (a.findings_count || 0), 0);
    const tone = findings > 0 || open > 3 ? "bg-red-50 border-red-200" : open > 0 ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200";
    return { site, open, findings, assessments: asmt.length, tone };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Compliance heatmap</h1>
        <p className="text-sm text-muted-foreground">
          Site-scoped requirement and assessment counts. Empty cells mean no assigned requirements — not
          a claim of legal compliance.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {cells.map((cell) => (
          <div key={cell.site.id} className={`rounded-2xl border p-4 ${cell.tone}`}>
            <p className="font-medium">{cell.site.name}</p>
            <p className="mt-1 text-sm">
              {cell.open} open requirement(s) · {cell.assessments} assessment(s) · {cell.findings} finding(s)
            </p>
          </div>
        ))}
        {!cells.length ? <p className="text-sm text-muted-foreground">No sites to plot.</p> : null}
      </div>
    </div>
  );
}
