import { ActionForm } from "@/components/shared/action-form";
import { SettingsNav } from "@/components/organization/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import {
  archiveCategoryAction,
  seedCategoriesAction,
  upsertCategoryAction,
} from "@/app/actions/reporting-config";

export default async function CategoriesSettingsPage() {
  const access = await requireModuleAccess({ permission: "settings.manage" });
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: types }, { data: categories }] = await Promise.all([
    access.supabase
      .from("event_types")
      .select("id, code, name")
      .is("organization_id", null)
      .order("sort_order"),
    access.supabase
      .from("event_categories")
      .select("id, code, name, is_active, event_type_id, event_types:event_type_id(name)")
      .eq("organization_id", access.organization.id)
      .order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Report categories</h1>
          <p className="text-sm text-muted-foreground">
            Seed examples only — archive instead of deleting historical categories.
          </p>
        </div>
        <ActionForm action={seedCategoriesAction}>
          <Button type="submit" variant="outline">
            Seed from templates
          </Button>
        </ActionForm>
      </div>
      <SettingsNav current="/app/settings/organization" />

      <ActionForm
        action={upsertCategoryAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4"
      >
        <div className="space-y-1">
          <Label>Report type</Label>
          <Select name="eventTypeId" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {(types ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Code</Label>
          <Input name="code" required />
        </div>
        <div className="space-y-1">
          <Label>Name</Label>
          <Input name="name" required />
        </div>
        <Button type="submit" className="self-end w-fit">
          Save category
        </Button>
      </ActionForm>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(categories ?? []).map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-3 py-2">
                  {(c.event_types as { name?: string } | null)?.name ?? "—"}
                </td>
                <td className="px-3 py-2 font-medium">{c.name}</td>
                <td className="px-3 py-2">{c.code}</td>
                <td className="px-3 py-2">{c.is_active ? "Active" : "Archived"}</td>
                <td className="px-3 py-2">
                  {c.is_active ? (
                    <ActionForm action={archiveCategoryAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Archive
                      </Button>
                    </ActionForm>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
