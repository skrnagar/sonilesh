import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { saveLicenseAction, saveLicenseConditionAction } from "@/app/actions/legal-register";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listRegulatoryPermits } from "@/lib/services/regulatory";

export default async function LicensesPage() {
  const access = await requireModuleAccess({
    featureCode: "regulatory_compliance",
    permission: "regulatory_permits.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Regulatory compliance" />;
  if (!access.permitted) return <ForbiddenState />;

  const [rows, sites, conditions] = await Promise.all([
    listRegulatoryPermits(access.supabase, access.organization.id, access.siteId),
    access.supabase
      .from("sites")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .order("name"),
    access.supabase
      .from("permit_conditions")
      .select("id, regulatory_permit_id, condition_text, due_date, status")
      .eq("organization_id", access.organization.id),
  ]);

  const byPermit = new Map<string, typeof conditions.data>();
  for (const row of conditions.data ?? []) {
    const list = byPermit.get(row.regulatory_permit_id) ?? [];
    list.push(row);
    byPermit.set(row.regulatory_permit_id, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Licenses & consents</h1>
        <p className="text-sm text-muted-foreground">
          Organization statutory licenses — not EHS Permit to Work. PTW remains under Permits.
        </p>
      </div>
      <ActionForm action={saveLicenseAction} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="name">License / consent name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="licenseNumber">Number</Label>
          <Input id="licenseNumber" name="licenseNumber" />
        </div>
        <div>
          <Label htmlFor="issuingAuthority">Issuing authority</Label>
          <Input id="issuingAuthority" name="issuingAuthority" />
        </div>
        <div>
          <Label htmlFor="siteId">Site</Label>
          <Select id="siteId" name="siteId" defaultValue="">
            <option value="">Organization-wide</option>
            {(sites.data ?? []).map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="expiresOn">Expires on</Label>
          <Input id="expiresOn" name="expiresOn" type="date" />
        </div>
        <Button type="submit">Add license</Button>
      </ActionForm>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
            <div className="flex justify-between gap-3">
              <p className="font-medium">{row.name}</p>
              <span className={row.expired ? "text-red-700" : "text-muted-foreground"}>
                {row.status}
                {row.expires_on ? ` · ${row.expires_on}` : ""}
                {row.expired ? " · expired" : ""}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {row.license_number ?? "No number"} · {row.issuing_authority ?? "Authority not recorded"} ·{" "}
              {(row.sites as { name?: string } | null)?.name ?? "Org-wide"}
            </p>
            <ul className="mt-2 list-disc pl-5 text-xs">
              {(byPermit.get(row.id) ?? []).map((c) => (
                <li key={c.id}>
                  {c.condition_text} {c.due_date ? `(due ${c.due_date})` : ""} · {c.status}
                </li>
              ))}
            </ul>
            <ActionForm action={saveLicenseConditionAction} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="permitId" value={row.id} />
              <Input name="conditionText" placeholder="Condition" className="max-w-sm" />
              <Input name="dueDate" type="date" className="w-40" />
              <Button type="submit" size="sm" variant="outline">
                Add condition
              </Button>
            </ActionForm>
          </li>
        ))}
        {!rows.length ? <li className="text-sm text-muted-foreground">No licenses recorded.</li> : null}
      </ul>
    </div>
  );
}
