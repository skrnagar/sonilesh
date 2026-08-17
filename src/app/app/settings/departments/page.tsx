import { ActionForm } from "@/components/shared/action-form";
import { SettingsNav } from "@/components/organization/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState } from "@/components/shared/state-panels";
import { createDepartmentAction } from "@/app/actions/hierarchy";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { DEFAULT_DEPARTMENTS } from "@/lib/constants/organization";

export default async function DepartmentsPage() {
  const access = await requireModuleAccess({ permission: "settings.manage" });
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: departments }, { data: sites }, { data: bus }] = await Promise.all([
    access.supabase
      .from("departments")
      .select("id, name, code, status, site_id, business_unit_id")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .order("name"),
    access.supabase
      .from("sites")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null),
    access.supabase
      .from("business_units")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Departments</h1>
        <p className="text-sm text-muted-foreground">
          Seed examples (EHS, Civil, …) are suggestions only — customize freely.
        </p>
      </div>
      <SettingsNav current="/app/settings/departments" />

      <ActionForm
        action={createDepartmentAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4"
      >
        <div className="space-y-1">
          <Label htmlFor="name">Department name</Label>
          <Input id="name" name="name" list="dept-suggestions" required />
          <datalist id="dept-suggestions">
            {DEFAULT_DEPARTMENTS.map((d) => (
              <option key={d.code} value={d.name} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="siteId">Site</Label>
          <Select id="siteId" name="siteId" defaultValue="">
            <option value="">Optional</option>
            {(sites ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="businessUnitId">Business unit</Label>
          <Select id="businessUnitId" name="businessUnitId" defaultValue="">
            <option value="">Optional</option>
            {(bus ?? []).map((bu) => (
              <option key={bu.id} value={bu.id}>
                {bu.name}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" className="md:col-span-4 w-fit">
          Create department
        </Button>
      </ActionForm>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(departments ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">
                  No departments yet.
                </td>
              </tr>
            ) : (
              (departments ?? []).map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2">{row.code}</td>
                  <td className="px-3 py-2 capitalize">{row.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
