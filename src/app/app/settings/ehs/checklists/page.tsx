import { ActionForm } from "@/components/shared/action-form";
import { SettingsNav } from "@/components/organization/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import {
  createTemplateAction,
  seedChecklistTemplatesAction,
} from "@/app/actions/checklists";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listTemplates } from "@/lib/services/checklists";

export default async function ChecklistTemplatesSettingsPage() {
  const access = await requireModuleAccess({
    featureCode: "inspections",
    permission: "checklists.manage",
  });
  if (!access.entitled) return <UpgradeState featureName="Checklists" />;
  if (!access.permitted) return <ForbiddenState />;

  const [inspectionTemplates, auditTemplates] = await Promise.all([
    listTemplates(access.supabase, access.organization.id, "inspection"),
    listTemplates(access.supabase, access.organization.id, "audit"),
  ]);
  const templates = [...inspectionTemplates, ...auditTemplates];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Checklist templates</h1>
        <p className="text-sm text-muted-foreground">
          One reusable engine for inspections, audits, and future modules (equipment, vehicle,
          contractor, …). PTW pre-work checklists remain on permit tables for now.
        </p>
      </div>
      <SettingsNav current="/app/settings/ehs/checklists" />

      <ActionForm action={seedChecklistTemplatesAction}>
        <input type="hidden" name="organizationId" value={access.organization.id} />
        <Button type="submit" variant="outline">
          Seed default Site Safety Walk + Internal Audit
        </Button>
      </ActionForm>

      <ActionForm
        action={createTemplateAction}
        className="grid max-w-2xl gap-3 rounded-2xl border border-border bg-card p-4"
      >
        <input type="hidden" name="organizationId" value={access.organization.id} />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" required placeholder="site_housekeeping" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="checklistType">Type</Label>
            <Select id="checklistType" name="checklistType" defaultValue="inspection">
              <option value="inspection">Inspection</option>
              <option value="audit">Audit</option>
              <option value="equipment">Equipment</option>
              <option value="vehicle">Vehicle</option>
              <option value="general">General</option>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sectionTitle">First section title</Label>
          <Input id="sectionTitle" name="sectionTitle" defaultValue="General" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="questions">Questions (one per line → Pass/Fail/NA)</Label>
          <Textarea id="questions" name="questions" rows={5} placeholder={"Housekeeping OK\nPPE compliance"} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="autoCapaOnFail" />
          Auto-create CAPA on fail
        </label>
        <Button type="submit" className="w-fit">
          Create template
        </Button>
      </ActionForm>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Scoring</th>
              <th className="px-3 py-2">Auto CAPA</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{t.code}</td>
                <td className="px-3 py-2">{t.name}</td>
                <td className="px-3 py-2 capitalize">{t.checklist_type}</td>
                <td className="px-3 py-2">{t.scoring_enabled ? "Yes" : "No"}</td>
                <td className="px-3 py-2">{t.auto_capa_on_fail ? "Yes" : "No"}</td>
              </tr>
            ))}
            {!templates.length ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  No templates yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
