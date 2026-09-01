import { ActionForm } from "@/components/shared/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestDataExportAction,
  updateFilePolicyAction,
} from "@/app/actions/org-admin";
import { requireOrgAdminAccess } from "@/lib/auth/org-admin";
import { FILE_UPLOAD_ROLE_OPTIONS } from "@/lib/constants/organization";

export default async function OrgAdminDataPage({
  searchParams,
}: {
  searchParams: Promise<{ exported?: string }>;
}) {
  const params = await searchParams;
  const access = await requireOrgAdminAccess();
  const { data: settings } = await access.supabase
    .from("organization_settings")
    .select("settings")
    .eq("organization_id", access.organization.id)
    .maybeSingle();

  const filePolicy = ((settings?.settings ?? {}) as Record<string, unknown>).file_policy as
    | { upload_roles?: string[]; retention_note?: string | null }
    | undefined;
  const uploadRoles = new Set(filePolicy?.upload_roles ?? []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Data</h1>
        <p className="text-sm text-muted-foreground">
          File upload policies and organization data export requests.
        </p>
      </div>

      {params.exported ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
          Export request recorded. You will be notified when your data package is ready.
        </div>
      ) : null}

      <ActionForm
        action={updateFilePolicyAction}
        className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="font-semibold">File upload policy</h2>
        <p className="text-sm text-muted-foreground">
          Roles allowed to upload attachments in the Files & Data app.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {FILE_UPLOAD_ROLE_OPTIONS.map((role) => (
            <label key={role} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="uploadRoles"
                value={role}
                defaultChecked={uploadRoles.size === 0 || uploadRoles.has(role)}
              />
              {role.replace(/_/g, " ")}
            </label>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="retentionNote">Retention note</Label>
          <Input
            id="retentionNote"
            name="retentionNote"
            defaultValue={filePolicy?.retention_note ?? ""}
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Save policy
        </button>
      </ActionForm>

      <form
        action={requestDataExportAction}
        className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="font-semibold">Export organization data</h2>
        <p className="text-sm text-muted-foreground">
          Request a full tenant data package. Exports are audited and delivered when ready.
        </p>
        <button
          type="submit"
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium"
        >
          Request export
        </button>
      </form>
    </div>
  );
}
