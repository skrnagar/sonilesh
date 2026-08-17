import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { MaterialityScatter } from "@/components/esg/materiality-scatter";
import { saveMaterialityAction } from "@/app/actions/esg";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function MaterialityPage() {
  const access = await requireModuleAccess({
    featureCode: "esg_reporting",
    permission: "esg.view",
  });
  if (!access.entitled) return <UpgradeState featureName="ESG / BRSR reporting" />;
  if (!access.permitted) return <ForbiddenState />;

  const year = new Date().getFullYear();
  const { data: rows } = await access.supabase
    .from("materiality_assessment")
    .select("id, topic, stakeholder_score, business_impact_score, notes, year")
    .eq("organization_id", access.organization.id)
    .eq("year", year);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Materiality assessment ({year})</h1>
        <p className="text-sm text-muted-foreground">
          Score topics 1–5 on stakeholder importance and business impact. The matrix is the board
          conversation starter, not a full double-materiality study.
        </p>
      </div>
      <MaterialityScatter points={rows ?? []} />
      <ActionForm action={saveMaterialityAction} className="max-w-lg space-y-3 rounded-2xl border border-border bg-card p-4">
        <input type="hidden" name="year" value={year} />
        <Input name="topic" placeholder="Topic (e.g. occupational health)" required />
        <Input name="stakeholderScore" type="number" min={1} max={5} defaultValue={3} />
        <Input name="businessImpactScore" type="number" min={1} max={5} defaultValue={3} />
        <Input name="notes" placeholder="Notes" />
        <Button type="submit">Add topic</Button>
      </ActionForm>
    </div>
  );
}
