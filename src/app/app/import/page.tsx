import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState } from "@/components/shared/state-panels";
import { enqueueImportAction } from "@/app/actions/integrations";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { formatDate } from "@/lib/utils";

export default async function ImportPage() {
  const access = await requireModuleAccess({ permission: "import.manage" });
  if (!access.permitted) return <ForbiddenState />;

  const { data: jobs } = await access.supabase
    .from("import_jobs")
    .select("id, entity_type, status, filename, row_count, success_count, error_count, created_at, finished_at")
    .eq("organization_id", access.organization.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Bulk import</h1>
        <p className="text-sm text-muted-foreground">
          CSV uploads are queued and processed in the background. Privilege fields such as owner or
          platform admin are ignored.
        </p>
      </div>

      <ActionForm action={enqueueImportAction} className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor="entityType">Entity</Label>
          <Select id="entityType" name="entityType" defaultValue="sites">
            <option value="users">Users (invites only)</option>
            <option value="workers">Workers</option>
            <option value="sites">Sites</option>
            <option value="projects">Projects</option>
            <option value="contractors">Contractors</option>
            <option value="training">Training</option>
            <option value="certificates">Certificates</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filename">Filename</Label>
          <input
            id="filename"
            name="filename"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            defaultValue="import.csv"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="csvText">CSV</Label>
          <textarea
            id="csvText"
            name="csvText"
            required
            rows={8}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
            placeholder="name,code,country,timezone,locale,currency"
          />
        </div>
        <Button type="submit">Queue import</Button>
      </ActionForm>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">File</th>
              <th className="px-3 py-2">Entity</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Rows</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {(jobs ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  No import jobs yet.
                </td>
              </tr>
            ) : (
              (jobs ?? []).map((job) => (
                <tr key={job.id} className="border-t border-border">
                  <td className="px-3 py-2">{job.filename}</td>
                  <td className="px-3 py-2">{job.entity_type}</td>
                  <td className="px-3 py-2">
                    {job.status} ({job.success_count}/{job.row_count}, {job.error_count} errors)
                  </td>
                  <td className="px-3 py-2">{job.row_count}</td>
                  <td className="px-3 py-2">{formatDate(job.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
