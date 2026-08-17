import { adminCreateFeatureAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { canManageFeatures } from "@/lib/auth/platform";
import { requirePlatformPermission } from "@/lib/auth/session";

export default async function AdminFeaturesPage() {
  const { supabase, platformRole } = await requirePlatformPermission("saas.features.view");
  const { data: features } = await supabase.from("features").select("*").order("code");
  const canEdit = canManageFeatures(platformRole);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Feature catalog</h1>
        <p className="text-sm text-muted-foreground">
          Keys are immutable after creation. These entitlements exist even when the EHS module is not yet implemented.
        </p>
      </div>
      {canEdit ? (
        <form action={adminCreateFeatureAction} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-5">
          <div>
            <Label>Key</Label>
            <Input name="code" required placeholder="advanced_analytics" />
          </div>
          <div>
            <Label>Name</Label>
            <Input name="name" required />
          </div>
          <div>
            <Label>Category</Label>
            <Select name="catalogGroup" defaultValue="ehs">
              {["core", "ehs", "operations", "analytics", "integrations", "enterprise", "ai"].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Type</Label>
            <Select name="featureType" defaultValue="boolean">
              {["boolean", "limit", "usage", "tier", "addon"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-5">
            <Label>Description</Label>
            <Input name="description" />
          </div>
          <div className="md:col-span-5">
            <Button type="submit">Create feature</Button>
          </div>
        </form>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Key</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {(features ?? []).map((feature) => (
              <tr key={feature.id} className="border-t border-border">
                <td className="px-3 py-2">{feature.name}</td>
                <td className="px-3 py-2 font-mono text-xs">{feature.code}</td>
                <td className="px-3 py-2">{feature.catalog_group ?? feature.category}</td>
                <td className="px-3 py-2">{feature.feature_type ?? feature.value_type}</td>
                <td className="px-3 py-2">{feature.is_active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
