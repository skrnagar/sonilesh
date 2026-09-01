import { ActionForm } from "@/components/shared/action-form";
import { SettingsNav } from "@/components/organization/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForbiddenState } from "@/components/shared/state-panels";
import { archiveRegionAction, createRegionAction } from "@/app/actions/regions";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function RegionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const access = await requireModuleAccess({ permission: "settings.manage" });
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: rows }, { data: bus }] = await Promise.all([
    access.supabase
      .from("regions")
      .select("id, name, code, description, status, business_unit_id, business_units:business_unit_id(name)")
      .eq("organization_id", access.organization.id)
      .order("name"),
    access.supabase
      .from("business_units")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .order("name"),
  ]);

  const filtered = (rows ?? []).filter((row) => {
    if (params.status === "archived" && row.status !== "archived") return false;
    if (params.status !== "archived" && row.status === "archived") return false;
    if (params.q && !row.name.toLowerCase().includes(params.q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Regions</h1>
        <p className="text-sm text-muted-foreground">
          Regional roll-up between business units and sites.
        </p>
      </div>
      <SettingsNav current="/app/settings/regions" />

      <form className="flex flex-wrap gap-2">
        <Input name="q" placeholder="Search…" defaultValue={params.q ?? ""} className="max-w-xs" />
        <select
          name="status"
          defaultValue={params.status ?? "active"}
          className="h-10 rounded-lg border border-border bg-card px-2 text-sm"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <ActionForm
        action={createRegionAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4"
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
          <Label htmlFor="businessUnitId">Business unit</Label>
          <select
            id="businessUnitId"
            name="businessUnitId"
            className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
          >
            <option value="">—</option>
            {(bus ?? []).map((bu) => (
              <option key={bu.id} value={bu.id}>
                {bu.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 md:col-span-4">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" />
        </div>
        <Button type="submit" className="md:col-span-4 w-fit">
          Create region
        </Button>
      </ActionForm>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Business unit</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!filtered.length ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  No regions yet. Create one to enable regional dashboard filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2">{row.code}</td>
                  <td className="px-3 py-2">
                    {(row.business_units as { name?: string } | null)?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2 capitalize">{row.status}</td>
                  <td className="px-3 py-2">
                    <ActionForm action={archiveRegionAction} className="inline-flex gap-2">
                      <input type="hidden" name="id" value={row.id} />
                      {row.status === "archived" ? (
                        <Button type="submit" name="status" value="active" size="sm" variant="outline">
                          Restore
                        </Button>
                      ) : (
                        <Button type="submit" name="status" value="archived" size="sm" variant="outline">
                          Archive
                        </Button>
                      )}
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
