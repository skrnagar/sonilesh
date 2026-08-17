import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getChemicalMetrics, listChemicals } from "@/lib/services/chemicals";

export default async function ChemicalsPage() {
  const access = await requireModuleAccess({
    featureCode: "chemical_sds",
    permission: "chemicals.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Chemical / SDS" />;
  if (!access.permitted) return <ForbiddenState />;

  const [rows, metrics] = await Promise.all([
    listChemicals(access.supabase, access.organization.id),
    getChemicalMetrics(access.supabase, access.organization.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Chemicals / SDS</h1>
          <p className="text-sm text-muted-foreground">
            Register, location, inventory. Uploaded SDS files are authoritative — no invented extraction.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/chemicals/sds">SDS register</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/app/chemicals/new">Add chemical</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Chemicals", metrics.total],
          ["Current SDS", metrics.withCurrentSds],
          ["Missing SDS", metrics.missingSds],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">CAS</th>
              <th className="px-3 py-2">Classification</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Qty</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  No chemicals registered.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const loc = r.locations as { name?: string } | null;
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Link href={`/app/chemicals/${r.id}`} className="font-medium text-accent hover:underline">
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{r.cas_number ?? "—"}</td>
                    <td className="px-3 py-2">{r.hazard_classification ?? "—"}</td>
                    <td className="px-3 py-2">{loc?.name ?? "—"}</td>
                    <td className="px-3 py-2">
                      {r.inventory_qty} {r.inventory_unit}
                    </td>
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
