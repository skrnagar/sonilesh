import Link from "next/link";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { createChemicalAction } from "@/app/actions/chemicals";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function NewChemicalPage() {
  const access = await requireModuleAccess({
    featureCode: "chemical_sds",
    permission: "chemicals.manage",
  });
  if (!access.entitled) return <UpgradeState featureName="Chemical / SDS" />;
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: locations }, { data: sites }] = await Promise.all([
    access.supabase.from("locations").select("id, name").eq("organization_id", access.organization.id).is("deleted_at", null),
    access.supabase.from("sites").select("id, name").eq("organization_id", access.organization.id).is("deleted_at", null),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Add chemical</h1>
          <p className="text-sm text-muted-foreground">Master record only. Upload SDS on the chemical page.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/chemicals">Cancel</Link>
        </Button>
      </div>
      <ActionForm action={createChemicalAction} className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="casNumber">CAS</Label>
            <Input id="casNumber" name="casNumber" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="unNumber">UN number</Label>
            <Input id="unNumber" name="unNumber" />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="hazardClassification">Hazard classification</Label>
          <Input id="hazardClassification" name="hazardClassification" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="locationId">Location</Label>
            <Select id="locationId" name="locationId">
              <option value="">—</option>
              {(locations ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="siteId">Site</Label>
            <Select id="siteId" name="siteId">
              <option value="">—</option>
              {(sites ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="inventoryQty">Inventory qty</Label>
            <Input id="inventoryQty" name="inventoryQty" type="number" step="0.01" defaultValue="0" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inventoryUnit">Unit</Label>
            <Input id="inventoryUnit" name="inventoryUnit" defaultValue="L" />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="usageNotes">Usage notes</Label>
          <Textarea id="usageNotes" name="usageNotes" />
        </div>
        <Button type="submit">Save</Button>
      </ActionForm>
    </div>
  );
}
