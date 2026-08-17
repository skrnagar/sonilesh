"use client";

import { adminUpsertPlanFeatureAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

type PlanCol = { id: string; name: string; code: string };
type FeatureRow = { id: string; code: string; name: string; catalog_group?: string | null };
type Cell = { planId: string; featureId: string; enabled: boolean; limitValue: number | null };

export function PlanFeatureMatrix({
  plans,
  features,
  cells,
  canEdit,
}: {
  plans: PlanCol[];
  features: FeatureRow[];
  cells: Cell[];
  canEdit: boolean;
}) {
  const lookup = new Map(
    cells.map((cell) => [`${cell.planId}:${cell.featureId}`, cell]),
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="sticky left-0 bg-muted/50 px-3 py-2.5">Feature</th>
            {plans.map((plan) => (
              <th key={plan.id} className="px-3 py-2.5">
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.id} className="border-t border-border">
              <td className="sticky left-0 bg-card px-3 py-2">
                <p className="font-medium">{feature.name}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{feature.code}</p>
              </td>
              {plans.map((plan) => {
                const cell = lookup.get(`${plan.id}:${feature.id}`);
                const enabled = Boolean(cell?.enabled);
                return (
                  <td key={plan.id} className="px-3 py-2">
                    {canEdit ? (
                      <form action={adminUpsertPlanFeatureAction} className="flex items-center gap-2">
                        <input type="hidden" name="planId" value={plan.id} />
                        <input type="hidden" name="featureId" value={feature.id} />
                        <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
                        <Button type="submit" size="sm" variant={enabled ? "default" : "outline"}>
                          {enabled ? "✓" : "–"}
                        </Button>
                        {cell?.limitValue != null ? (
                          <span className="text-[11px] tabular-nums text-muted-foreground">
                            {cell.limitValue}
                          </span>
                        ) : null}
                      </form>
                    ) : (
                      <span>{enabled ? "✓" : "–"}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
