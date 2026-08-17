import { ActionForm } from "@/components/shared/action-form";
import { SettingsNav } from "@/components/organization/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForbiddenState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { upsertSeverityAction } from "@/app/actions/reporting-config";

export default async function SeveritiesSettingsPage() {
  const access = await requireModuleAccess({ permission: "settings.manage" });
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: system }, { data: orgLevels }] = await Promise.all([
    access.supabase
      .from("severity_levels")
      .select("id, code, name, rank, color, score, description, requires_investigation, is_active")
      .is("organization_id", null)
      .order("rank"),
    access.supabase
      .from("severity_levels")
      .select("id, code, name, rank, color, score, description, requires_investigation, is_active")
      .eq("organization_id", access.organization.id)
      .order("rank"),
  ]);

  const rows = [...(orgLevels ?? []), ...(system ?? [])];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Severities</h1>
        <p className="text-sm text-muted-foreground">
          Labels and scores only — detailed risk calculation belongs to the future Risk Engine.
        </p>
      </div>
      <SettingsNav current="/app/settings/organization" />

      <ActionForm
        action={upsertSeverityAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3"
      >
        <div className="space-y-1">
          <Label>Code</Label>
          <Input name="code" required placeholder="high" />
        </div>
        <div className="space-y-1">
          <Label>Label</Label>
          <Input name="name" required placeholder="High" />
        </div>
        <div className="space-y-1">
          <Label>Rank</Label>
          <Input name="rank" type="number" defaultValue={3} />
        </div>
        <div className="space-y-1">
          <Label>Score</Label>
          <Input name="score" type="number" defaultValue={75} />
        </div>
        <div className="space-y-1">
          <Label>Color token</Label>
          <Input name="color" placeholder="#E8A87C" />
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <Input name="description" />
        </div>
        <label className="flex items-center gap-2 text-sm md:col-span-3">
          <input type="checkbox" name="requiresInvestigation" /> Requires investigation
        </label>
        <Button type="submit" className="w-fit">
          Save org severity
        </Button>
      </ActionForm>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Rank</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Investigation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-3 py-2 font-medium">
                  <span
                    className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: row.color ?? "#999" }}
                  />
                  {row.name}
                </td>
                <td className="px-3 py-2">{row.code}</td>
                <td className="px-3 py-2">{row.rank}</td>
                <td className="px-3 py-2">{row.score ?? "—"}</td>
                <td className="px-3 py-2">{row.requires_investigation ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
