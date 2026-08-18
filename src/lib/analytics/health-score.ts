import type { HealthComponent, HealthScoreResult, MetricValue } from "./types";

export type HealthWeightConfig = {
  overdue_capa?: number;
  critical_incidents?: number;
  overdue_training?: number;
  high_residual_risk?: number;
  inspection_completion?: number;
  compliance_overdue?: number;
};

export const DEFAULT_HEALTH_WEIGHTS: Required<HealthWeightConfig> = {
  overdue_capa: 25,
  critical_incidents: 20,
  overdue_training: 10,
  high_residual_risk: 15,
  inspection_completion: 15,
  compliance_overdue: 15,
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

function countToScore(count: number, worseAt: number) {
  if (count <= 0) return 100;
  return clamp(100 - (count / worseAt) * 100);
}

export function computeHealthScore(
  metrics: MetricValue[],
  weights: HealthWeightConfig = {},
): HealthScoreResult {
  const merged = { ...DEFAULT_HEALTH_WEIGHTS, ...weights };
  const byCode = new Map(metrics.map((m) => [m.code, m]));

  const components: HealthComponent[] = [
    {
      code: "overdue_capa",
      label: "Overdue CAPA",
      weight: merged.overdue_capa,
      score: null,
      included: false,
      note: "100 if none overdue; declines toward 0 as overdue CAPA approaches 10.",
    },
    {
      code: "critical_incidents",
      label: "Critical incidents",
      weight: merged.critical_incidents,
      score: null,
      included: false,
      note: "100 if none in period; declines toward 0 as count approaches 5.",
    },
    {
      code: "overdue_training",
      label: "Training overdue",
      weight: merged.overdue_training,
      score: null,
      included: false,
      note: "100 if none overdue; declines toward 0 as overdue assignments approach 20.",
    },
    {
      code: "high_residual_risk",
      label: "High residual risk",
      weight: merged.high_residual_risk,
      score: null,
      included: false,
      note: "100 if none; declines toward 0 as high residual hazards approach 15.",
    },
    {
      code: "inspection_completion",
      label: "Inspection completion",
      weight: merged.inspection_completion,
      score: null,
      included: false,
      note: "Uses recorded completion percent. Omitted when no inspections exist.",
    },
    {
      code: "compliance_overdue",
      label: "Overdue filings",
      weight: merged.compliance_overdue,
      score: null,
      included: false,
      note: "100 if none overdue; declines toward 0 as overdue filings approach 8.",
    },
  ];

  const overdueCapa = byCode.get("overdue_capa");
  if (overdueCapa && overdueCapa.value != null) {
    components[0].score = countToScore(overdueCapa.value, 10);
    components[0].included = true;
  }
  const critical = byCode.get("critical_incidents");
  if (critical && critical.value != null) {
    components[1].score = countToScore(critical.value, 5);
    components[1].included = true;
  }
  const training = byCode.get("training_overdue");
  if (training && training.value != null && !training.missingReason) {
    components[2].score = countToScore(training.value, 20);
    components[2].included = true;
  }
  const risk = byCode.get("high_residual_risk");
  if (risk && risk.value != null) {
    components[3].score = countToScore(risk.value, 15);
    components[3].included = true;
  }
  const insp = byCode.get("inspection_completion");
  if (insp && insp.value != null && !insp.missingReason) {
    components[4].score = clamp(insp.value);
    components[4].included = insp.hint !== "No inspections";
  }
  const compliance = byCode.get("compliance_overdue");
  if (compliance && compliance.value != null) {
    components[5].score = countToScore(compliance.value, 8);
    components[5].included = true;
  }

  const included = components.filter((c) => c.included && c.score != null);
  const weightSum = included.reduce((s, c) => s + c.weight, 0);
  const score =
    included.length && weightSum > 0
      ? Math.round(included.reduce((s, c) => s + (c.score as number) * c.weight, 0) / weightSum)
      : null;

  const explanation = [
    "EHS Health is an optional composite, not a certification or the only truth. Read it beside the source KPIs.",
    "Each included component is scored 0–100 from recorded counts or completion percent, then weighted.",
    `Default weights: overdue CAPA ${merged.overdue_capa}, critical incidents ${merged.critical_incidents}, training ${merged.overdue_training}, high residual risk ${merged.high_residual_risk}, inspections ${merged.inspection_completion}, overdue filings ${merged.compliance_overdue}.`,
    included.length
      ? `This view uses ${included.length} component(s). Missing modules are omitted rather than scored as zero.`
      : "No components had source data in this scope.",
  ];

  return {
    score,
    components,
    explanation,
    incomplete: included.length < components.length,
  };
}
