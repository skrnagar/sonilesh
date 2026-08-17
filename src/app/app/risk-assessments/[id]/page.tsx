import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addControlAction,
  addStepAction,
  addTeamMemberAction,
  transitionRiskAction,
  upsertHazardAction,
} from "@/app/actions/risk";
import { ActionForm } from "@/components/shared/action-form";
import { RiskMatrixVisual } from "@/components/risk/risk-matrix";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import {
  canTransitionRisk,
  getRiskAssessmentBundle,
  HIERARCHY_OF_CONTROLS,
  RISK_TRANSITIONS,
  type RiskBand,
} from "@/lib/services/risk";
import { formatDate } from "@/lib/utils";

type ControlRow = {
  id: string;
  control_type: string;
  hierarchy: string;
  description: string;
};

type HazardRow = {
  id: string;
  hazard_description: string;
  task_step: string | null;
  persons_at_risk: string | null;
  existing_controls_summary: string | null;
  additional_controls_summary: string | null;
  inherent_likelihood: number | null;
  inherent_consequence: number | null;
  inherent_score: number | null;
  inherent_band: string | null;
  residual_likelihood: number | null;
  residual_consequence: number | null;
  residual_score: number | null;
  residual_band: string | null;
  status: string;
  risk_controls?: ControlRow[];
};

export default async function RiskAssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireModuleAccess({
    permission: "risk.view",
  });
  if (!access.permitted) return <ForbiddenState />;

  const bundle = await getRiskAssessmentBundle(
    access.supabase,
    access.organization.id,
    id,
  );
  if (!bundle) notFound();

  const { assessment, hazards, team, steps, activity } = bundle;
  const typeMeta = assessment.risk_assessment_types as {
    code?: string;
    name?: string;
  } | null;

  const featureByType =
    typeMeta?.code === "jsa"
      ? "jsa"
      : typeMeta?.code === "jha"
        ? "jha"
        : "risk_assessment";
  const featureAccess = await requireModuleAccess({
    featureCode: featureByType,
    permission: "risk.view",
  });
  if (!featureAccess.entitled) {
    return <UpgradeState featureName={typeMeta?.name ?? featureByType} />;
  }
  if (!featureAccess.permitted) return <ForbiddenState />;

  const matrix = assessment.risk_matrices as {
    likelihood_max?: number;
    consequence_max?: number;
    bands?: RiskBand[];
    likelihood_labels?: string[];
    consequence_labels?: string[];
  } | null;

  const nextStatuses = Object.keys(RISK_TRANSITIONS).filter((to) =>
    canTransitionRisk(assessment.status, to),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {typeMeta?.name ?? "Risk assessment"}
          </p>
          <h1 className="text-xl font-semibold text-primary">{assessment.assessment_number}</h1>
          <p className="text-sm text-muted-foreground">{assessment.title}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {String(assessment.status).replace(/_/g, " ")}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/risk-assessments">Back to list</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/risk-register">Register</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold">Summary</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Activity / task</dt>
              <dd>{assessment.task_activity || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Site</dt>
              <dd>{(assessment.sites as { name?: string } | null)?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Project</dt>
              <dd>{(assessment.projects as { name?: string } | null)?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Inherent</dt>
              <dd className="capitalize">
                {assessment.inherent_risk_band ?? "—"}
                {assessment.inherent_risk_score != null
                  ? ` (${assessment.inherent_risk_score})`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Residual</dt>
              <dd className="capitalize">
                {assessment.residual_risk_band ?? "—"}
                {assessment.residual_risk_score != null
                  ? ` (${assessment.residual_risk_score})`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Next review</dt>
              <dd>{assessment.next_review_date ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Workflow</h2>
          {nextStatuses.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No further transitions.</p>
          ) : (
            <ActionForm action={transitionRiskAction} className="mt-3 space-y-3">
              <input type="hidden" name="organizationId" value={access.organization.id} />
              <input type="hidden" name="assessmentId" value={assessment.id} />
              <div className="space-y-1">
                <Label htmlFor="toStatus">Transition to</Label>
                <Select id="toStatus" name="toStatus" required defaultValue={nextStatuses[0]}>
                  {nextStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Apply
              </Button>
            </ActionForm>
          )}
        </section>
      </div>

      {matrix ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Risk matrix</h2>
          <RiskMatrixVisual
            likelihoodMax={matrix.likelihood_max ?? 5}
            consequenceMax={matrix.consequence_max ?? 5}
            bands={(matrix.bands ?? []) as RiskBand[]}
            likelihoodLabels={(matrix.likelihood_labels as string[]) ?? []}
            consequenceLabels={(matrix.consequence_labels as string[]) ?? []}
          />
        </div>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Job steps (JSA / JHA)</h2>
        <ul className="space-y-2 text-sm">
          {steps.map((step) => (
            <li key={step.id} className="border-b border-border py-2">
              <span className="font-medium">
                {step.sort_order + 1}. {step.step_name}
              </span>
              {step.description ? (
                <p className="text-muted-foreground">{step.description}</p>
              ) : null}
            </li>
          ))}
          {!steps.length ? (
            <li className="text-muted-foreground">No steps yet — add for JSA/JHA structure.</li>
          ) : null}
        </ul>
        <ActionForm action={addStepAction} className="grid gap-2 md:grid-cols-4">
          <input type="hidden" name="organizationId" value={access.organization.id} />
          <input type="hidden" name="assessmentId" value={assessment.id} />
          <Input name="stepName" placeholder="Step name" required className="md:col-span-2" />
          <Input name="description" placeholder="Description" />
          <Input name="sortOrder" type="number" defaultValue={steps.length} />
          <Button type="submit" variant="outline" className="w-fit">
            Add step
          </Button>
        </ActionForm>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Hazards & controls</h2>
        <ActionForm
          action={upsertHazardAction}
          className="grid gap-3 rounded-xl border border-dashed border-border p-3 md:grid-cols-4"
        >
          <input type="hidden" name="organizationId" value={access.organization.id} />
          <input type="hidden" name="assessmentId" value={assessment.id} />
          <div className="space-y-1 md:col-span-4">
            <Label htmlFor="hazardDescription">Hazard</Label>
            <Textarea id="hazardDescription" name="hazardDescription" required rows={2} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="taskStep">Task / step</Label>
            <Input id="taskStep" name="taskStep" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="personsAtRisk">Persons at risk</Label>
            <Input id="personsAtRisk" name="personsAtRisk" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inherentLikelihood">Inherent L</Label>
            <Input
              id="inherentLikelihood"
              name="inherentLikelihood"
              type="number"
              min={1}
              max={10}
              defaultValue={2}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inherentConsequence">Inherent C</Label>
            <Input
              id="inherentConsequence"
              name="inherentConsequence"
              type="number"
              min={1}
              max={10}
              defaultValue={2}
              required
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="existingControls">Existing controls</Label>
            <Input id="existingControls" name="existingControls" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="additionalControls">Additional controls</Label>
            <Input id="additionalControls" name="additionalControls" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="residualLikelihood">Residual L</Label>
            <Input
              id="residualLikelihood"
              name="residualLikelihood"
              type="number"
              min={1}
              max={10}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="residualConsequence">Residual C</Label>
            <Input
              id="residualConsequence"
              name="residualConsequence"
              type="number"
              min={1}
              max={10}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="targetDate">Target date</Label>
            <Input id="targetDate" name="targetDate" type="date" />
          </div>
          <Button type="submit" className="self-end">
            Add hazard
          </Button>
        </ActionForm>

        <div className="space-y-4">
          {(hazards as HazardRow[]).map((h) => (
            <article key={h.id} className="rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{h.hazard_description}</p>
                  {h.task_step ? (
                    <p className="text-xs text-muted-foreground">Step: {h.task_step}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="capitalize">
                    Inherent {h.inherent_band ?? "—"} ({h.inherent_score ?? "—"})
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    Residual {h.residual_band ?? "—"} ({h.residual_score ?? "—"})
                  </Badge>
                </div>
              </div>
              {(h.existing_controls_summary || h.additional_controls_summary) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Existing: {h.existing_controls_summary || "—"} · Additional:{" "}
                  {h.additional_controls_summary || "—"}
                </p>
              )}
              <ul className="mt-2 space-y-1 text-sm">
                {(h.risk_controls ?? []).map((c) => (
                  <li key={c.id} className="text-muted-foreground">
                    <span className="capitalize text-foreground">{c.control_type}</span> ·{" "}
                    <span className="capitalize">{c.hierarchy}</span> — {c.description}
                  </li>
                ))}
              </ul>
              <ActionForm
                action={addControlAction}
                className="mt-3 grid gap-2 border-t border-border pt-3 md:grid-cols-5"
              >
                <input type="hidden" name="organizationId" value={access.organization.id} />
                <input type="hidden" name="assessmentId" value={assessment.id} />
                <input type="hidden" name="hazardId" value={h.id} />
                <Select name="controlType" defaultValue="additional">
                  <option value="existing">Existing</option>
                  <option value="additional">Additional</option>
                </Select>
                <Select name="hierarchy" defaultValue="administrative">
                  {HIERARCHY_OF_CONTROLS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </Select>
                <Input name="description" placeholder="Control description" required className="md:col-span-2" />
                <Button type="submit" variant="outline" size="sm">
                  Add control
                </Button>
              </ActionForm>
            </article>
          ))}
          {!hazards.length ? (
            <p className="text-sm text-muted-foreground">No hazards identified yet.</p>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Assessment team</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {team.map((m) => (
              <li key={m.id} className="border-b border-border py-2">
                {m.member_name || m.user_id || "Member"}
                {m.role_label ? ` · ${m.role_label}` : ""}
              </li>
            ))}
            {!team.length ? (
              <li className="text-muted-foreground">No team members yet.</li>
            ) : null}
          </ul>
          <ActionForm action={addTeamMemberAction} className="mt-3 grid gap-2 md:grid-cols-3">
            <input type="hidden" name="organizationId" value={access.organization.id} />
            <input type="hidden" name="assessmentId" value={assessment.id} />
            <Input name="memberName" placeholder="Name" required />
            <Input name="roleLabel" placeholder="Role" defaultValue="Assessor" />
            <Button type="submit" variant="outline">
              Add member
            </Button>
          </ActionForm>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Activity / review trail</h2>
          <ul className="mt-2 max-h-80 space-y-2 overflow-y-auto text-sm">
            {activity.map((item) => (
              <li key={item.id} className="border-b border-border py-2">
                <p>{item.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(item.created_at)} · {item.activity_type}
                </p>
              </li>
            ))}
            {!activity.length ? (
              <li className="text-muted-foreground">No activity yet.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
