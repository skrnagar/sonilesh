import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { saveMetricDefinitionAction } from "@/app/actions/esg";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listMetricDefinitions } from "@/lib/services/esg";

export default async function MetricDefinitionsPage() {
  const access = await requireModuleAccess({
    featureCode: "esg",
    permission: "esg.view",
  });
  if (!access.entitled) return <UpgradeState featureName="ESG" />;
  if (!access.permitted) return <ForbiddenState />;

  const rows = await listMetricDefinitions(access.supabase, access.organization.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">ESG metric definitions</h1>
        <p className="text-sm text-muted-foreground">
          Catalog plus organization-defined metrics. Values are entered per period; history is appended,
          not rewritten.
        </p>
      </div>
      <ActionForm action={saveMetricDefinitionAction} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3">
        <div>
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" required />
        </div>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" name="unit" />
        </div>
        <Button type="submit">Add definition</Button>
      </ActionForm>
      <ul className="divide-y rounded-2xl border border-border bg-card">
        {rows.map((row) => (
          <li key={row.id} className="flex justify-between px-4 py-3 text-sm">
            <span>
              <span className="font-mono text-xs">{row.code}</span> · {row.name}
            </span>
            <span className="text-muted-foreground">
              {row.unit ?? "no unit"} · {row.source_type}
              {row.organization_id ? " · org" : " · catalog"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
