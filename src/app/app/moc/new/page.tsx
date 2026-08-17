import Link from "next/link";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { createMocAction } from "@/app/actions/moc";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function NewMocPage() {
  const access = await requireModuleAccess({ featureCode: "moc", permission: "moc.manage" });
  if (!access.entitled) return <UpgradeState featureName="Management of Change" />;
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: sites }, { data: risks }, { data: courses }] = await Promise.all([
    access.supabase.from("sites").select("id, name").eq("organization_id", access.organization.id).is("deleted_at", null),
    access.supabase
      .from("risk_assessments")
      .select("id, assessment_number, title, status")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
    access.supabase
      .from("training_courses")
      .select("id, code, title")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">New MOC</h1>
          <p className="text-sm text-muted-foreground">Link an existing risk assessment from this organization only.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/moc">Cancel</Link>
        </Button>
      </div>
      <ActionForm action={createMocAction} className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="changeType">Change type</Label>
          <Input id="changeType" name="changeType" placeholder="process, equipment, organization…" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="currentState">Current state</Label>
            <Textarea id="currentState" name="currentState" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="proposedState">Proposed state</Label>
            <Textarea id="proposedState" name="proposedState" />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="siteId">Site</Label>
          <Select id="siteId" name="siteId">
            <option value="">—</option>
            {(sites ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="riskAssessmentId">Linked risk (same org)</Label>
          <Select id="riskAssessmentId" name="riskAssessmentId">
            <option value="">None yet</option>
            {(risks ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.assessment_number} {r.title} ({r.status})
              </option>
            ))}
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="trainingRequired" />
          Training required
        </label>
        <Select name="trainingCourseId">
          <option value="">Training course (optional)</option>
          {(courses ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} {c.title}
            </option>
          ))}
        </Select>
        <Button type="submit">Create MOC</Button>
      </ActionForm>
    </div>
  );
}
