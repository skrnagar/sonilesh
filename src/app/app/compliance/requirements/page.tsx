import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { saveRequirementAction } from "@/app/actions/legal-register";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listLegalRegister, listRequirements } from "@/lib/services/legal-register";

export default async function RequirementsPage() {
  const access = await requireModuleAccess({
    featureCode: "legal_register",
    permission: "legal_register.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Legal register" />;
  if (!access.permitted) return <ForbiddenState />;

  const siteId = access.siteId;
  const [rows, entries, templates] = await Promise.all([
    listRequirements(access.supabase, access.organization.id, siteId),
    listLegalRegister(access.supabase, access.organization.id, siteId),
    access.supabase
      .from("checklist_templates")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .eq("checklist_type", "compliance")
      .eq("is_active", true),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Requirements</h1>
        <p className="text-sm text-muted-foreground">
          Actions for a site only appear when assigned to that site. Assessments reuse the checklist engine.
        </p>
      </div>
      <ActionForm action={saveRequirementAction} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="legalRegisterEntryId">Legal register entry</Label>
          <Select id="legalRegisterEntryId" name="legalRegisterEntryId" required>
            <option value="">Select</option>
            {entries.map((row) => (
              <option key={row.id} value={row.id}>
                {row.title}
              </option>
            ))}
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="title">Requirement</Label>
          <Input id="title" name="title" required />
        </div>
        <div>
          <Label htmlFor="frequency">Frequency</Label>
          <Select id="frequency" name="frequency" defaultValue="annual">
            <option value="one_time">One-time</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
            <option value="event_based">Event-based</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="templateId">Checklist template (optional)</Label>
          <Select id="templateId" name="templateId" defaultValue="">
            <option value="">None yet</option>
            {(templates.data ?? []).map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit">Add requirement</Button>
      </ActionForm>
      <ul className="divide-y rounded-2xl border border-border bg-card">
        {rows.map((row) => (
          <li key={row.id} className="px-4 py-3 text-sm">
            <p className="font-medium">{row.title}</p>
            <p className="text-xs text-muted-foreground">
              {(row.sites as { name?: string } | null)?.name ?? "Org-wide"} · {row.frequency} · {row.status}
            </p>
          </li>
        ))}
        {!rows.length ? <li className="px-4 py-6 text-sm text-muted-foreground">No requirements in this site scope.</li> : null}
      </ul>
    </div>
  );
}
