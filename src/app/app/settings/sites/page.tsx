import { ActionForm } from "@/components/shared/action-form";
import { SettingsNav } from "@/components/organization/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState } from "@/components/shared/state-panels";
import { archiveSiteAction, createSiteAction } from "@/app/actions/hierarchy";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { checkLimit } from "@/lib/services/entitlements";
import Link from "next/link";

export default async function SitesPage() {
  const access = await requireModuleAccess({ permission: "settings.manage" });
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: sites }, { data: bus }, limit] = await Promise.all([
    access.supabase
      .from("sites")
      .select(
        "id, name, code, status, site_type, city, country, business_unit_id, start_date, end_date",
      )
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .order("name"),
    access.supabase
      .from("business_units")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .eq("status", "active")
      .is("deleted_at", null),
    checkLimit(access.supabase, access.organization.id, "max_sites", 0),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Sites</h1>
        <p className="text-sm text-muted-foreground">
          Permanent or temporary project sites. Plan limit:{" "}
          {limit.unlimited || limit.limit == null
            ? "unlimited"
            : `${limit.limit} (remaining ${limit.remaining ?? 0})`}
          .
        </p>
      </div>
      <SettingsNav current="/app/settings/sites" />

      {!limit.allowed ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          Your current plan allows {limit.limit ?? 0} sites.{" "}
          <Link className="underline" href="/app/settings/subscription">
            Upgrade plan
          </Link>{" "}
          or contact sales.
        </div>
      ) : null}

      <ActionForm
        action={createSiteAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3"
      >
        <div className="space-y-1">
          <Label htmlFor="name">Site name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="code">Site code</Label>
          <Input id="code" name="code" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="businessUnitId">Business unit</Label>
          <Select id="businessUnitId" name="businessUnitId" defaultValue="">
            <option value="">None</option>
            {(bus ?? []).map((bu) => (
              <option key={bu.id} value={bu.id}>
                {bu.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="siteType">Site type</Label>
          <Select id="siteType" name="siteType" defaultValue="permanent">
            <option value="permanent">Permanent site</option>
            <option value="temporary_project">Temporary project site</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" name="timezone" defaultValue="Asia/Kolkata" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="latitude">Latitude</Label>
          <Input id="latitude" name="latitude" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="longitude">Longitude</Label>
          <Input id="longitude" name="longitude" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" name="startDate" type="date" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" name="endDate" type="date" />
        </div>
        <Button type="submit" className="md:col-span-3 w-fit">
          Create site
        </Button>
      </ActionForm>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(sites ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  No sites yet.
                </td>
              </tr>
            ) : (
              (sites ?? []).map((site) => (
                <tr key={site.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{site.name}</td>
                  <td className="px-3 py-2">{site.code}</td>
                  <td className="px-3 py-2">{site.site_type}</td>
                  <td className="px-3 py-2">
                    {[site.city, site.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-3 py-2 capitalize">{site.status}</td>
                  <td className="px-3 py-2">
                    <ActionForm action={archiveSiteAction}>
                      <input type="hidden" name="id" value={site.id} />
                      <Button type="submit" name="status" value="archived" size="sm" variant="outline">
                        Archive
                      </Button>
                    </ActionForm>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
