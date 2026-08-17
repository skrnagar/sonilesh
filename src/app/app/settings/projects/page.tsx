import Link from "next/link";
import { ActionForm } from "@/components/shared/action-form";
import { SettingsNav } from "@/components/organization/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState } from "@/components/shared/state-panels";
import { createProjectAction, updateProjectStatusAction } from "@/app/actions/hierarchy";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { DEFAULT_PROJECT_TYPES } from "@/lib/constants/organization";
import { checkLimit } from "@/lib/services/entitlements";

export default async function ProjectsPage() {
  const access = await requireModuleAccess({ permission: "settings.manage" });
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: projects }, { data: sites }, { data: bus }, { data: customTypes }, limit] =
    await Promise.all([
      access.supabase
        .from("projects")
        .select(
          "id, name, code, status, project_type, client_name, site_id, business_unit_id, start_date, expected_end_date",
        )
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
      access.supabase
        .from("organization_project_types")
        .select("code, name")
        .eq("organization_id", access.organization.id)
        .eq("is_active", true),
      checkLimit(access.supabase, access.organization.id, "max_projects", 0),
    ]);

  const types =
    (customTypes ?? []).length > 0
      ? customTypes!
      : DEFAULT_PROJECT_TYPES.map((t) => ({ code: t.code, name: t.name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Configurable project types. Plan limit:{" "}
          {limit.unlimited || limit.limit == null
            ? "unlimited"
            : `${limit.limit} (remaining ${limit.remaining ?? 0})`}
          .
        </p>
      </div>
      <SettingsNav current="/app/settings/projects" />

      {!limit.allowed ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          Your current plan allows {limit.limit ?? 0} projects.{" "}
          <Link className="underline" href="/app/settings/subscription">
            Upgrade plan
          </Link>
        </div>
      ) : null}

      <ActionForm
        action={createProjectAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3"
      >
        <div className="space-y-1">
          <Label htmlFor="name">Project name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="projectType">Project type</Label>
          <Select id="projectType" name="projectType" defaultValue="">
            <option value="">Select</option>
            {types.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </Select>
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
        <div className="space-y-1">
          <Label htmlFor="siteId">Site</Label>
          <Select id="siteId" name="siteId" defaultValue="">
            <option value="">None</option>
            {(sites ?? []).map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="clientName">Client</Label>
          <Input id="clientName" name="clientName" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" name="startDate" type="date" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="expectedEndDate">Expected end</Label>
          <Input id="expectedEndDate" name="expectedEndDate" type="date" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue="planning">
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
        <Button type="submit" className="md:col-span-3 w-fit">
          Create project
        </Button>
      </ActionForm>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(projects ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  No projects yet.
                </td>
              </tr>
            ) : (
              (projects ?? []).map((project) => (
                <tr key={project.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">
                    {project.name}{" "}
                    <span className="text-xs text-muted-foreground">{project.code}</span>
                  </td>
                  <td className="px-3 py-2">{project.project_type ?? "—"}</td>
                  <td className="px-3 py-2">{project.client_name ?? "—"}</td>
                  <td className="px-3 py-2 capitalize">{String(project.status).replace("_", " ")}</td>
                  <td className="px-3 py-2">
                    <ActionForm action={updateProjectStatusAction} className="flex gap-2">
                      <input type="hidden" name="id" value={project.id} />
                      <Button type="submit" name="status" value="active" size="sm" variant="outline">
                        Activate
                      </Button>
                      <Button type="submit" name="status" value="on_hold" size="sm" variant="outline">
                        Hold
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
