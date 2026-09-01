import type { SupabaseClient } from "@supabase/supabase-js";

export type ScoreDimension = {
  key: string;
  label: string;
  score: number | null;
  weight: number;
  source: "calculated" | "insufficient";
  hint: string;
};

export type EhsScoreStatus = "calculated" | "insufficient_data";

export type EhsScoreResult = {
  overall: number | null;
  dimensions: ScoreDimension[];
  status: EhsScoreStatus;
  /** @deprecated Use `status === 'insufficient_data'` — kept for existing UI branches */
  isDemo: boolean;
  dataCoverage: {
    dataPoints: number;
    minimumRequired: number;
  };
  periodLabel: string;
};

/** Minimum operational records required before publishing a calculated score. */
export const EHS_SCORE_MIN_DATA_POINTS = 5;

const DIMENSION_DEFS = [
  { key: "leadership", label: "Leadership & commitment", weight: 1 },
  { key: "planning", label: "Planning & risk", weight: 1.2 },
  { key: "operations", label: "Operational control", weight: 1.3 },
  { key: "performance", label: "Performance monitoring", weight: 1 },
  { key: "improvement", label: "Continual improvement", weight: 1 },
] as const;

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function weightedAverage(dimensions: ScoreDimension[]) {
  const scored = dimensions.filter((d) => d.score !== null);
  const totalWeight = scored.reduce((sum, d) => sum + d.weight, 0);
  if (!totalWeight) return null;
  const weighted = scored.reduce((sum, d) => sum + (d.score as number) * d.weight, 0);
  return clampScore(weighted / totalWeight);
}

type ScopeFilter = {
  businessUnitId?: string;
  regionId?: string;
  siteId?: string;
  projectId?: string;
  regionSiteIds?: string[] | null;
};

function applyEventScope<T extends { eq: (col: string, val: string) => T; in: (col: string, vals: string[]) => T }>(
  query: T,
  scope: ScopeFilter,
) {
  let next = query;
  if (scope.siteId) next = next.eq("site_id", scope.siteId);
  else if (scope.regionSiteIds?.length) next = next.in("site_id", scope.regionSiteIds);
  if (scope.projectId) next = next.eq("project_id", scope.projectId);
  if (scope.businessUnitId) next = next.eq("business_unit_id", scope.businessUnitId);
  return next;
}

function insufficientResult(
  periodLabel: string,
  dataPoints: number,
): EhsScoreResult {
  return {
    overall: null,
    status: "insufficient_data",
    isDemo: false,
    dataCoverage: { dataPoints, minimumRequired: EHS_SCORE_MIN_DATA_POINTS },
    periodLabel,
    dimensions: DIMENSION_DEFS.map((def) => ({
      key: def.key,
      label: def.label,
      score: null,
      weight: def.weight,
      source: "insufficient" as const,
      hint: `Insufficient operational data (need ${EHS_SCORE_MIN_DATA_POINTS}+ records, have ${dataPoints})`,
    })),
  };
}

export async function calculateEhsScore(
  supabase: SupabaseClient,
  organizationId: string,
  scope: ScopeFilter = {},
): Promise<EhsScoreResult> {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const periodLabel = now.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  let eventsQuery = supabase
    .from("ehs_events")
    .select("id, status, occurred_at, event_types:event_type_id(code)")
    .eq("organization_id", organizationId)
    .gte("occurred_at", periodStart)
    .is("deleted_at", null)
    .limit(200);
  eventsQuery = applyEventScope(eventsQuery, scope);

  let capaQuery = supabase
    .from("capa_items")
    .select("id, status, due_date")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .limit(200);
  if (scope.siteId) capaQuery = capaQuery.eq("site_id", scope.siteId);
  if (scope.projectId) capaQuery = capaQuery.eq("project_id", scope.projectId);

  let lmraQuery = supabase
    .from("lmra_assessments")
    .select("id, status")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .gte("created_at", periodStart)
    .limit(120);
  if (scope.siteId) lmraQuery = lmraQuery.eq("site_id", scope.siteId);
  if (scope.projectId) lmraQuery = lmraQuery.eq("project_id", scope.projectId);

  let inspectionQuery = supabase
    .from("checklist_assignments")
    .select("id, status")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .gte("created_at", periodStart)
    .limit(120);
  if (scope.siteId) inspectionQuery = inspectionQuery.eq("site_id", scope.siteId);
  if (scope.projectId) inspectionQuery = inspectionQuery.eq("project_id", scope.projectId);

  const [
    { data: events },
    { data: capa },
    { data: lmra },
    { data: inspections },
    { data: training },
  ] = await Promise.all([
    eventsQuery,
    capaQuery,
    lmraQuery,
    inspectionQuery,
    supabase
      .from("training_assignments")
      .select("id, status")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .limit(200),
  ]);

  const eventRows = events ?? [];
  const capaRows = capa ?? [];
  const lmraRows = lmra ?? [];
  const inspectionRows = inspections ?? [];
  const trainingRows = training ?? [];

  const dataPoints =
    eventRows.length + capaRows.length + lmraRows.length + inspectionRows.length + trainingRows.length;

  if (dataPoints < EHS_SCORE_MIN_DATA_POINTS) {
    return insufficientResult(periodLabel, dataPoints);
  }

  const incidents = eventRows.filter(
    (e) => (e.event_types as { code?: string } | null)?.code === "incident",
  );
  const openIncidents = incidents.filter((e) => !["closed", "cancelled"].includes(e.status)).length;
  const uauc = eventRows.filter((e) => {
    const code = (e.event_types as { code?: string } | null)?.code;
    return code === "unsafe_act" || code === "unsafe_condition";
  });
  const closedUauc = uauc.filter((e) => e.status === "closed").length;
  const uaucClosureRate = uauc.length ? (closedUauc / uauc.length) * 100 : null;

  const closedCapa = capaRows.filter((c) => ["closed", "verified"].includes(c.status)).length;
  const openCapa = capaRows.length - closedCapa;
  const capaClosureRate = capaRows.length ? (closedCapa / capaRows.length) * 100 : null;

  const approvedLmra = lmraRows.filter((l) => l.status === "approved").length;
  const lmraRate = lmraRows.length ? (approvedLmra / lmraRows.length) * 100 : null;

  const completedInspections = inspectionRows.filter((i) => i.status === "completed").length;
  const inspectionRate = inspectionRows.length
    ? (completedInspections / inspectionRows.length) * 100
    : null;

  const completedTraining = trainingRows.filter((t) => t.status === "completed").length;
  const trainingRate = trainingRows.length ? (completedTraining / trainingRows.length) * 100 : null;

  const incidentPenalty = Math.min(40, openIncidents * 8 + incidents.length * 2);

  const dimensions: ScoreDimension[] = DIMENSION_DEFS.map((def) => {
    let score: number | null = null;
    let hint = "Based on tenant operational data";

    switch (def.key) {
      case "leadership":
        if (trainingRate !== null) {
          score = clampScore(trainingRate * 0.6 + 40);
          hint = `Training completion ${Math.round(trainingRate)}% (${trainingRows.length} assignments)`;
        } else {
          hint = "No training assignments in period";
        }
        break;
      case "planning":
        if (lmraRate !== null || uaucClosureRate !== null) {
          const lmraPart = lmraRate ?? 0;
          const uaucPart = uaucClosureRate ?? 0;
          const lmraWeight = lmraRate !== null ? 0.7 : 0;
          const uaucWeight = uaucClosureRate !== null ? 0.3 : 0;
          const total = lmraWeight + uaucWeight;
          score = clampScore(total ? (lmraPart * lmraWeight + uaucPart * uaucWeight) / total : 0);
          hint = `LMRA approval ${lmraRate !== null ? Math.round(lmraRate) : "N/A"}%, UA/UC closure ${uaucClosureRate !== null ? Math.round(uaucClosureRate) : "N/A"}%`;
        } else {
          hint = "No LMRA or UA/UC data in period";
        }
        break;
      case "operations":
        if (inspectionRate !== null) {
          score = clampScore(inspectionRate * 0.8 + 20);
          hint = `Inspection completion ${Math.round(inspectionRate)}% (${inspectionRows.length} assignments)`;
        } else {
          hint = "No inspection assignments in period";
        }
        break;
      case "performance":
        score = clampScore(100 - incidentPenalty);
        hint = `${incidents.length} incidents, ${openIncidents} open`;
        break;
      case "improvement":
        if (capaClosureRate !== null) {
          score = clampScore(capaClosureRate);
          hint = `CAPA closure ${Math.round(capaClosureRate)}%, ${openCapa} open`;
        } else {
          hint = "No CAPA items in period";
        }
        break;
    }

    return {
      key: def.key,
      label: def.label,
      score,
      weight: def.weight,
      source: score !== null ? "calculated" : "insufficient",
      hint,
    };
  });

  const overall = weightedAverage(dimensions);

  return {
    overall,
    dimensions,
    status: overall !== null ? "calculated" : "insufficient_data",
    isDemo: false,
    dataCoverage: { dataPoints, minimumRequired: EHS_SCORE_MIN_DATA_POINTS },
    periodLabel,
  };
}
