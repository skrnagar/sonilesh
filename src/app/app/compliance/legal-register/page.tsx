import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { saveLegalRegisterAction } from "@/app/actions/legal-register";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listLegalRegister, listRegulations } from "@/lib/services/legal-register";

export default async function LegalRegisterPage() {
  const access = await requireModuleAccess({
    featureCode: "legal_register",
    permission: "legal_register.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Legal register" />;
  if (!access.permitted) return <ForbiddenState />;

  const siteId = access.siteId;
  const [rows, regulations, sites] = await Promise.all([
    listLegalRegister(access.supabase, access.organization.id, siteId),
    listRegulations(access.supabase, access.organization.id),
    access.supabase
      .from("sites")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Legal register</h1>
        <p className="text-sm text-muted-foreground">
          Organization-specific. Site-assigned entries do not appear as another site&apos;s actions.
          {siteId ? " Filtered to the current site plus org-wide rows." : " Showing all sites."} Not
          legal advice.
        </p>
      </div>

      <ActionForm action={saveLegalRegisterAction} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="title">Entry title</Label>
          <Input id="title" name="title" required />
        </div>
        <div>
          <Label htmlFor="regulationId">Regulation (catalog)</Label>
          <Select id="regulationId" name="regulationId" defaultValue="">
            <option value="">None</option>
            {regulations.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} — {row.title}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="siteId">Assign to site</Label>
          <Select id="siteId" name="siteId" defaultValue={siteId ?? ""}>
            <option value="">Organization-wide</option>
            {(sites.data ?? []).map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="justification">Justification / notes</Label>
          <Input id="justification" name="justification" />
        </div>
        <Button type="submit">Add register entry</Button>
      </ActionForm>

      <ul className="divide-y rounded-2xl border border-border bg-card">
        {rows.map((row) => (
          <li key={row.id} className="px-4 py-3 text-sm">
            <p className="font-medium">{row.title}</p>
            <p className="text-xs text-muted-foreground">
              {(row.sites as { name?: string } | null)?.name ?? "Org-wide"} · {row.status} ·{" "}
              {(row.regulations as { code?: string } | null)?.code ?? "no catalog link"}
            </p>
          </li>
        ))}
        {!rows.length ? (
          <li className="px-4 py-6 text-sm text-muted-foreground">No register entries for this scope.</li>
        ) : null}
      </ul>
    </div>
  );
}
