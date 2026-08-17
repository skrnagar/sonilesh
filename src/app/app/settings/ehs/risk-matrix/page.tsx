import Link from "next/link";
import { ActionForm } from "@/components/shared/action-form";
import { SettingsNav } from "@/components/organization/settings-nav";
import { RiskMatrixVisual } from "@/components/risk/risk-matrix";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { updateMatrixAction } from "@/app/actions/risk";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { ensureDefaultMatrix, type RiskBand } from "@/lib/services/risk";

export default async function RiskMatrixSettingsPage() {
  const access = await requireModuleAccess({
    featureCode: "risk_assessment",
    permission: "risk.update",
  });
  if (!access.entitled) return <UpgradeState featureName="Risk matrix" />;
  if (!access.permitted) return <ForbiddenState />;

  const matrix = await ensureDefaultMatrix(access.supabase, access.organization.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Risk matrix</h1>
          <p className="text-sm text-muted-foreground">
            Organization-configurable likelihood × consequence bands. Scoring never hard-codes band
            names.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/risk-assessments">Assessments</Link>
        </Button>
      </div>
      <SettingsNav current="/app/settings/ehs/risk-matrix" />

      <div className="rounded-2xl border border-border bg-card p-4">
        <RiskMatrixVisual
          likelihoodMax={matrix.likelihood_max}
          consequenceMax={matrix.consequence_max}
          bands={(matrix.bands ?? []) as RiskBand[]}
          likelihoodLabels={(matrix.likelihood_labels as string[]) ?? []}
          consequenceLabels={(matrix.consequence_labels as string[]) ?? []}
        />
      </div>

      <ActionForm
        action={updateMatrixAction}
        className="grid max-w-xl gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2"
      >
        <input type="hidden" name="organizationId" value={access.organization.id} />
        <input type="hidden" name="matrixId" value={matrix.id} />
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="name">Matrix name</Label>
          <Input id="name" name="name" defaultValue={matrix.name ?? "Default 5x5"} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="likelihoodMax">Likelihood max (2–10)</Label>
          <Input
            id="likelihoodMax"
            name="likelihoodMax"
            type="number"
            min={2}
            max={10}
            defaultValue={matrix.likelihood_max}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="consequenceMax">Consequence max (2–10)</Label>
          <Input
            id="consequenceMax"
            name="consequenceMax"
            type="number"
            min={2}
            max={10}
            defaultValue={matrix.consequence_max}
          />
        </div>
        <Button type="submit" className="w-fit">
          Save matrix size
        </Button>
      </ActionForm>
      <p className="text-xs text-muted-foreground">
        Band colors and score ranges ship with the default matrix seed. Advanced band editing can
        extend this settings page without changing scoring services.
      </p>
    </div>
  );
}
