import type { SupabaseClient } from "@supabase/supabase-js";



export type ScoreDimension = {

  key: string;

  label: string;

  score: number;

  weight: number;

  source: "calculated" | "manual" | "demo";

  hint: string;

};



export type EhsScoreResult = {

  overall: number;

  dimensions: ScoreDimension[];

  isDemo: boolean;

  periodLabel: string;

};



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

  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);

  if (!totalWeight) return 0;

  const weighted = dimensions.reduce((sum, d) => sum + d.score * d.weight, 0);

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

    .is("deleted_at", null);

  eventsQuery = applyEventScope(eventsQuery, scope);



  let capaQuery = supabase

    .from("capa_items")

    .select("id, status, due_date")

    .eq("organization_id", organizationId)

    .is("deleted_at", null);

  if (scope.siteId) capaQuery = capaQuery.eq("site_id", scope.siteId);

  if (scope.projectId) capaQuery = capaQuery.eq("project_id", scope.projectId);



  let lmraQuery = supabase

    .from("lmra_assessments")

    .select("id, status")

    .eq("organization_id", organizationId)

    .is("deleted_at", null)

    .gte("created_at", periodStart);

  if (scope.siteId) lmraQuery = lmraQuery.eq("site_id", scope.siteId);

  if (scope.projectId) lmraQuery = lmraQuery.eq("project_id", scope.projectId);



  let inspectionQuery = supabase

    .from("checklist_assignments")

    .select("id, status")

    .eq("organization_id", organizationId)

    .is("deleted_at", null)

    .gte("created_at", periodStart);

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

  const isDemo = dataPoints < 5;



  const incidents = eventRows.filter(

    (e) => (e.event_types as { code?: string } | null)?.code === "incident",

  );

  const openIncidents = incidents.filter((e) => !["closed", "cancelled"].includes(e.status)).length;

  const uauc = eventRows.filter((e) => {

    const code = (e.event_types as { code?: string } | null)?.code;

    return code === "unsafe_act" || code === "unsafe_condition";

  });

  const closedUauc = uauc.filter((e) => e.status === "closed").length;

  const uaucClosureRate = uauc.length ? (closedUauc / uauc.length) * 100 : 100;



  const closedCapa = capaRows.filter((c) => ["closed", "verified"].includes(c.status)).length;
  const openCapa = capaRows.length - closedCapa;
  const capaClosureRate = capaRows.length ? (closedCapa / capaRows.length) * 100 : 100;



  const approvedLmra = lmraRows.filter((l) => l.status === "approved").length;

  const lmraRate = lmraRows.length ? (approvedLmra / lmraRows.length) * 100 : 75;



  const completedInspections = inspectionRows.filter((i) => i.status === "completed").length;

  const inspectionRate = inspectionRows.length

    ? (completedInspections / inspectionRows.length) * 100

    : 70;



  const completedTraining = trainingRows.filter((t) => t.status === "completed").length;

  const trainingRate = trainingRows.length ? (completedTraining / trainingRows.length) * 100 : 65;



  const incidentPenalty = Math.min(40, openIncidents * 8 + incidents.length * 2);



  const dimensions: ScoreDimension[] = DIMENSION_DEFS.map((def) => {

    let score = 70;

    let hint = "Based on tenant operational data";

    let source: ScoreDimension["source"] = isDemo ? "demo" : "calculated";



    switch (def.key) {

      case "leadership":

        score = clampScore(trainingRate * 0.6 + 40);

        hint = `Training completion ${Math.round(trainingRate)}%`;

        break;

      case "planning":

        score = clampScore(lmraRate * 0.7 + uaucClosureRate * 0.3);

        hint = `LMRA approval ${Math.round(lmraRate)}%, UA/UC closure ${Math.round(uaucClosureRate)}%`;

        break;

      case "operations":

        score = clampScore(inspectionRate * 0.8 + 20);

        hint = `Inspection completion ${Math.round(inspectionRate)}%`;

        break;

      case "performance":

        score = clampScore(100 - incidentPenalty);

        hint = `${incidents.length} incidents, ${openIncidents} open`;

        break;

      case "improvement":

        score = clampScore(capaClosureRate);

        hint = `CAPA closure ${Math.round(capaClosureRate)}%, ${openCapa} open`;

        break;

    }



    if (isDemo) {

      score = clampScore(score * 0.85 + 10);

      hint = `${hint} — limited data`;

      source = "demo";

    }



    return {

      key: def.key,

      label: def.label,

      score,

      weight: def.weight,

      source,

      hint,

    };

  });



  return {

    overall: weightedAverage(dimensions),

    dimensions,

    isDemo,

    periodLabel,

  };

}

