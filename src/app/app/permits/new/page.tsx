import Link from "next/link";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { createPermitAction } from "@/app/actions/permits";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function NewPermitPage() {
  const access = await requireModuleAccess({
    featureCode: "permit_to_work",
    permission: "permits.create",
  });
  if (!access.entitled) return <UpgradeState featureName="Permit to Work" />;
  if (!access.permitted) return <ForbiddenState />;

  const orgId = access.organization.id;
  const [{ data: types }, { data: sites }, { data: projects }, { data: risks }, { data: contractors }] =
    await Promise.all([
      access.supabase
        .from("permit_types")
        .select("id, code, name, requires_risk_assessment, default_validity_hours")
        .or(`organization_id.eq.${orgId},organization_id.is.null`)
        .eq("is_active", true)
        .order("sort_order"),
      access.supabase
        .from("sites")
        .select("id, name")
        .eq("organization_id", orgId)
        .is("deleted_at", null),
      access.supabase
        .from("projects")
        .select("id, name")
        .eq("organization_id", orgId)
        .is("deleted_at", null),
      access.supabase
        .from("risk_assessments")
        .select("id, assessment_number, title, status, residual_risk_band")
        .eq("organization_id", orgId)
        .eq("status", "active")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50),
      access.supabase
        .from("contractor_companies")
        .select("id, name, status")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("name"),
    ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">New permit</h1>
          <p className="text-sm text-muted-foreground">
            Request → risk → checklist → approvals → active. Links existing Risk / JSA / JHA — does
            not recalculate risk.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/permits">Cancel</Link>
        </Button>
      </div>

      <ActionForm action={createPermitAction} className="space-y-6">
        <input type="hidden" name="organizationId" value={orgId} />

        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">1. Permit type</h2>
          <div className="space-y-1">
            <Label htmlFor="permitTypeCode">Type</Label>
            <Select id="permitTypeCode" name="permitTypeCode" required defaultValue="general_work">
              {(types ?? []).map((t) => (
                <option key={t.id} value={t.code}>
                  {t.name}
                  {t.requires_risk_assessment ? " (risk required)" : ""}
                </option>
              ))}
            </Select>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">2. Work information</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="title">Work title</Label>
              <Input id="title" name="title" required placeholder="Describe the work" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="workDescription">Work description</Label>
              <Textarea id="workDescription" name="workDescription" rows={3} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="workOrderRef">Work order / reference</Label>
              <Input id="workOrderRef" name="workOrderRef" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clientReference">Client reference</Label>
              <Input id="clientReference" name="clientReference" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="priority">Priority</Label>
              <Select id="priority" name="priority" defaultValue="normal">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="workerCount">Number of workers</Label>
              <Input id="workerCount" name="workerCount" type="number" min={1} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contractorCompanyId">Contractor company</Label>
              <Select id="contractorCompanyId" name="contractorCompanyId" defaultValue="">
                <option value="">None</option>
                {(contractors ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status})
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                Eligibility is advisory unless the organization enables PTW enforcement in contractor
                settings.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="equipment">Equipment</Label>
              <Input id="equipment" name="equipment" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tools">Tools</Label>
              <Input id="tools" name="tools" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="materials">Materials</Label>
              <Input id="materials" name="materials" />
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">3. Location & validity</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="siteId">Site</Label>
              <Select id="siteId" name="siteId" defaultValue="">
                <option value="">Select site</option>
                {(sites ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="projectId">Project</Label>
              <Select id="projectId" name="projectId" defaultValue="">
                <option value="">Optional</option>
                {(projects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="validFrom">Planned start</Label>
              <Input id="validFrom" name="validFrom" type="datetime-local" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="validTo">Planned end</Label>
              <Input id="validTo" name="validTo" type="datetime-local" />
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">4–5. Risk linkage</h2>
          <p className="text-xs text-muted-foreground">
            Select an approved assessment from the Risk Engine, or{" "}
            <Link href="/app/risk-assessments" className="text-accent underline">
              create one first
            </Link>
            .
          </p>
          <div className="space-y-1">
            <Label htmlFor="riskAssessmentId">Risk assessment / JSA / JHA</Label>
            <Select id="riskAssessmentId" name="riskAssessmentId" defaultValue="">
              <option value="">None (draft may defer)</option>
              {(risks ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.assessment_number} — {r.title} ({r.residual_risk_band ?? "no band"})
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="additionalControls">Additional controls</Label>
            <Textarea id="additionalControls" name="additionalControls" rows={2} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isolationLoto" />
            Isolation / LOTO required
          </label>
        </section>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" name="asDraft" value="0">
            Submit request
          </Button>
          <Button type="submit" name="asDraft" value="1" variant="outline">
            Save draft
          </Button>
        </div>
      </ActionForm>
    </div>
  );
}
