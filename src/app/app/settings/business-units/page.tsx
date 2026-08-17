import { ActionForm } from "@/components/shared/action-form";
import { SettingsNav } from "@/components/organization/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForbiddenState } from "@/components/shared/state-panels";
import {
  archiveBusinessUnitAction,
  createBusinessUnitAction,
} from "@/app/actions/hierarchy";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function BusinessUnitsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const access = await requireModuleAccess({ permission: "settings.manage" });
  if (!access.permitted) return <ForbiddenState />;

  let query = access.supabase
    .from("business_units")
    .select("id, name, code, description, status, created_at")
    .eq("organization_id", access.organization.id)
    .order("name");
  if (params.status === "archived") {
    query = query.eq("status", "archived");
  } else if (params.status === "inactive") {
    query = query.eq("status", "inactive");
  } else {
    query = query.neq("status", "archived").is("deleted_at", null);
  }
  if (params.q) query = query.ilike("name", `%${params.q}%`);
  const { data: rows } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Business units</h1>
        <p className="text-sm text-muted-foreground">
          Soft-archive only — units with history are never hard-deleted.
        </p>
      </div>
      <SettingsNav current="/app/settings/business-units" />

      <form className="flex flex-wrap gap-2">
        <Input name="q" placeholder="Search…" defaultValue={params.q ?? ""} className="max-w-xs" />
        <select
          name="status"
          defaultValue={params.status ?? "active"}
          className="h-10 rounded-lg border border-border bg-card px-2 text-sm"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <ActionForm
        action={createBusinessUnitAction}
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
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" />
        </div>
        <Button type="submit" className="md:col-span-4 w-fit">
          Create business unit
        </Button>
      </ActionForm>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  No business units yet.
                </td>
              </tr>
            ) : (
              (rows ?? []).map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2">{row.code}</td>
                  <td className="px-3 py-2 capitalize">{row.status}</td>
                  <td className="px-3 py-2">
                    <ActionForm action={archiveBusinessUnitAction} className="inline-flex gap-2">
                      <input type="hidden" name="id" value={row.id} />
                      {row.status === "archived" ? (
                        <Button type="submit" name="status" value="active" size="sm" variant="outline">
                          Restore
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          name="status"
                          value="archived"
                          size="sm"
                          variant="outline"
                        >
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
