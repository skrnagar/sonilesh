import { ActionForm } from "@/components/shared/action-form";
import { SettingsNav } from "@/components/organization/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState } from "@/components/shared/state-panels";
import { createLocationAction } from "@/app/actions/hierarchy";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { LOCATION_TYPES } from "@/lib/constants/organization";

export default async function LocationsPage() {
  const access = await requireModuleAccess({ permission: "settings.manage" });
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: locations }, { data: sites }, { data: projects }] = await Promise.all([
    access.supabase
      .from("locations")
      .select("id, name, code, status, site_id, project_id, parent_location_id, location_type")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .order("name"),
    access.supabase
      .from("sites")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null),
    access.supabase
      .from("projects")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Locations</h1>
        <p className="text-sm text-muted-foreground">
          Hierarchical locations (zone → area → sub-area) under a site.
        </p>
      </div>
      <SettingsNav current="/app/settings/locations" />

      <ActionForm
        action={createLocationAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3"
      >
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="locationType">Type</Label>
          <Select id="locationType" name="locationType" defaultValue="other">
            {LOCATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="siteId">Site</Label>
          <Select id="siteId" name="siteId" required defaultValue="">
            <option value="" disabled>
              Required
            </option>
            {(sites ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="projectId">Project</Label>
          <Select id="projectId" name="projectId" defaultValue="">
            <option value="">Optional</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="parentLocationId">Parent location</Label>
          <Select id="parentLocationId" name="parentLocationId" defaultValue="">
            <option value="">None (top level)</option>
            {(locations ?? []).map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1 md:col-span-3">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" />
        </div>
        <Button type="submit" className="md:col-span-3 w-fit">
          Create location
        </Button>
      </ActionForm>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Parent</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(locations ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  No locations yet.
                </td>
              </tr>
            ) : (
              (locations ?? []).map((loc) => {
                const parent = (locations ?? []).find((l) => l.id === loc.parent_location_id);
                return (
                  <tr key={loc.id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">
                      {loc.name}{" "}
                      <span className="text-xs text-muted-foreground">{loc.code}</span>
                    </td>
                    <td className="px-3 py-2">{String(loc.location_type).replace(/_/g, " ")}</td>
                    <td className="px-3 py-2">{parent?.name ?? "—"}</td>
                    <td className="px-3 py-2 capitalize">{loc.status}</td>
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
