import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { saveGhgAction } from "@/app/actions/esg";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function GhgInventoryPage() {
  const access = await requireModuleAccess({
    featureCode: "esg_reporting",
    permission: "esg.view",
  });
  if (!access.entitled) return <UpgradeState featureName="ESG / BRSR reporting" />;
  if (!access.permitted) return <ForbiddenState />;

  const { data: rows } = await access.supabase
    .from("ghg_emissions")
    .select("id, scope, category, value_tco2e, period_start, period_end, site_id, source_data_ref")
    .eq("organization_id", access.organization.id)
    .order("period_start", { ascending: false })
    .limit(100);

  const totals = { "1": 0, "2": 0, "3": 0 };
  for (const row of rows ?? []) {
    const scope = row.scope as "1" | "2" | "3";
    totals[scope] += Number(row.value_tco2e ?? 0);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">GHG inventory</h1>
        <p className="text-sm text-muted-foreground">
          Scope 1 and 2 here satisfy BRSR Core Attribute 1.{" "}
          <strong>This data also feeds your CBAM export readiness</strong> when you ship to the EU.
          Enter energy-derived tCO2e once — do not maintain a second spreadsheet for ESG.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {(["1", "2", "3"] as const).map((scope) => (
          <div key={scope} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Scope {scope}</p>
            <p className="text-2xl font-semibold">{totals[scope].toFixed(1)} tCO2e</p>
          </div>
        ))}
      </div>
      <ActionForm action={saveGhgAction} className="grid max-w-2xl gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2">
        <select name="scope" className="rounded-md border border-border bg-background px-3 py-2 text-sm" defaultValue="1">
          <option value="1">Scope 1</option>
          <option value="2">Scope 2</option>
          <option value="3">Scope 3</option>
        </select>
        <Input name="category" placeholder="Category" />
        <Input name="periodStart" type="date" required />
        <Input name="periodEnd" type="date" required />
        <Input name="valueTco2e" type="number" step="0.01" placeholder="tCO2e" required />
        <Input name="sourceDataRef" placeholder="Source (meter / invoice / EHS energy log)" />
        <div className="md:col-span-2">
          <Button type="submit">Add line</Button>
        </div>
      </ActionForm>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-muted-foreground">
            <th className="py-2">Period</th>
            <th>Scope</th>
            <th>Category</th>
            <th>tCO2e</th>
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).map((row) => (
            <tr key={row.id} className="border-t border-border">
              <td className="py-2">
                {row.period_start} → {row.period_end}
              </td>
              <td>{row.scope}</td>
              <td>{row.category}</td>
              <td>{row.value_tco2e}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
