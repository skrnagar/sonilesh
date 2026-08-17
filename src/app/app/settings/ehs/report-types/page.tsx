import { ActionForm } from "@/components/shared/action-form";
import { SettingsNav } from "@/components/organization/settings-nav";
import { Button } from "@/components/ui/button";
import { ForbiddenState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { REPORT_TYPE_META } from "@/lib/reporting/types";
import {
  archiveCustomFieldAction,
  upsertCustomFieldAction,
} from "@/app/actions/reporting-config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CUSTOM_FIELD_TYPES } from "@/lib/reporting/types";

export default async function ReportTypesSettingsPage() {
  const access = await requireModuleAccess({ permission: "settings.manage" });
  if (!access.permitted) return <ForbiddenState />;

  const { data: types } = await access.supabase
    .from("event_types")
    .select("id, code, name, feature_code, is_active, sort_order")
    .is("organization_id", null)
    .order("sort_order");

  const { data: fields } = await access.supabase
    .from("report_custom_field_definitions")
    .select("id, code, label, field_type, event_type_id, is_active")
    .eq("organization_id", access.organization.id)
    .is("archived_at", null)
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Report types</h1>
        <p className="text-sm text-muted-foreground">
          Database-driven types. Activation follows subscription entitlements.
        </p>
      </div>
      <SettingsNav current="/app/settings/organization" />

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Feature</th>
              <th className="px-3 py-2">Prefix</th>
              <th className="px-3 py-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {(types ?? []).map((t) => {
              const meta = REPORT_TYPE_META[t.code as keyof typeof REPORT_TYPE_META];
              return (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{t.name}</td>
                  <td className="px-3 py-2">{t.feature_code}</td>
                  <td className="px-3 py-2">{meta?.prefix ?? "—"}</td>
                  <td className="px-3 py-2">{t.is_active ? "Yes" : "No"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Custom fields</h2>
        <ActionForm
          action={upsertCustomFieldAction}
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
            <Input name="code" required placeholder="client_ref" />
          </div>
          <div className="space-y-1">
            <Label>Label</Label>
            <Input name="label" required placeholder="Client Reference" />
          </div>
          <div className="space-y-1">
            <Label>Field type</Label>
            <Select name="fieldType" defaultValue="text">
              {CUSTOM_FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-3">
            <input type="checkbox" name="required" /> Required
          </label>
          <Button type="submit" className="w-fit">
            Add custom field
          </Button>
        </ActionForm>

        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Label</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(fields ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    No custom fields yet — e.g. Tower Number, Inverter Block.
                  </td>
                </tr>
              ) : (
                (fields ?? []).map((f) => (
                  <tr key={f.id} className="border-t border-border">
                    <td className="px-3 py-2">{f.label}</td>
                    <td className="px-3 py-2">{f.code}</td>
                    <td className="px-3 py-2">{f.field_type}</td>
                    <td className="px-3 py-2">
                      <ActionForm action={archiveCustomFieldAction}>
                        <input type="hidden" name="id" value={f.id} />
                        <Button type="submit" size="sm" variant="outline">
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
      </section>
    </div>
  );
}
