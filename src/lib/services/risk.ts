import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { requireFeature } from "@/lib/services/entitlements";
import { requirePermission } from "@/lib/services/rbac";
import { createCapa } from "@/lib/services/capa";

export type RiskBand = {
  code: string;
  name: string;
  min_score: number;
  max_score: number;
  color?: string;
};

export type RiskMatrixConfig = {
  id: string;
  name?: string;
  likelihood_max: number;
  consequence_max: number;
  bands: RiskBand[];
  likelihood_labels: string[];
  consequence_labels: string[];
};

export const RISK_TRANSITIONS: Record<string, string[]> = {
  draft: ["team_assigned", "in_progress", "cancelled"],
  team_assigned: ["in_progress", "cancelled"],
  in_progress: ["review", "cancelled"],
  review: ["approval", "in_progress"],
  approval: ["active", "review"],
  active: ["periodic_review", "retired"],
  periodic_review: ["active", "retired"],
  retired: [],
  cancelled: [],
};

export const HIERARCHY_OF_CONTROLS = [
  "elimination",
  "substitution",
  "engineering",
  "administrative",
  "ppe",
] as const;

export function scoreRisk(likelihood: number, consequence: number) {
  return likelihood * consequence;
}

/** Resolve band from org matrix config — never hard-coded. */
export function resolveBand(score: number, bands: RiskBand[]) {
  const sorted = [...bands].sort((a, b) => a.min_score - b.min_score);
  const match = sorted.find((b) => score >= b.min_score && score <= b.max_score);
  return match?.code ?? null;
}

export function canTransitionRisk(from: string, to: string) {
  return RISK_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function ensureDefaultMatrix(
  supabase: SupabaseClient,
  organizationId: string,
) {
  const { data: existing } = await supabase
    .from("risk_matrices")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_default", true)
    .maybeSingle();
  if (existing) return existing as RiskMatrixConfig;

  const { data, error } = await supabase
    .from("risk_matrices")
    .insert({
      organization_id: organizationId,
      name: "Default 5x5",
      is_default: true,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as RiskMatrixConfig;
}

export async function createRiskAssessment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    typeCode: "risk_assessment" | "jsa" | "jha";
    title: string;
    taskActivity?: string;
    siteId?: string;
    projectId?: string;
    departmentId?: string;
    locationId?: string;
    businessUnitId?: string;
    sourceEventId?: string;
    nextReviewDate?: string;
    notes?: string;
  },
) {
  const feature =
    input.typeCode === "jsa"
      ? "jsa"
      : input.typeCode === "jha"
        ? "jha"
        : "risk_assessment";
  await requireFeature(supabase, input.organizationId, feature);
  await requirePermission(supabase, input.organizationId, input.userId, "risk.create");

  for (const [label, id, table] of [
    ["Site", input.siteId, "sites"],
    ["Project", input.projectId, "projects"],
  ] as const) {
    if (!id) continue;
    const { data: ref } = await supabase
      .from(table)
      .select("id")
      .eq("id", id)
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!ref) throw new Error(`${label} must belong to this organization`);
  }

  const { data: typeRow } = await supabase
    .from("risk_assessment_types")
    .select("id")
    .eq("code", input.typeCode)
    .is("organization_id", null)
    .maybeSingle();
  if (!typeRow) throw new Error("Risk assessment type seed missing");

  const matrix = await ensureDefaultMatrix(supabase, input.organizationId);
  const prefix =
    input.typeCode === "jsa" ? "JSA-" : input.typeCode === "jha" ? "JHA-" : "RA-";
  const { data: number, error: numErr } = await supabase.rpc("next_event_number", {
    p_organization_id: input.organizationId,
    p_sequence_key: input.typeCode,
    p_prefix: prefix,
  });
  if (numErr) throw new Error(numErr.message);

  const { data, error } = await supabase
    .from("risk_assessments")
    .insert({
      organization_id: input.organizationId,
      assessment_type_id: typeRow.id,
      matrix_id: matrix.id,
      assessment_number: number as string,
      title: input.title,
      task_activity: input.taskActivity ?? null,
      site_id: input.siteId ?? null,
      project_id: input.projectId ?? null,
      department_id: input.departmentId ?? null,
      location_id: input.locationId ?? null,
      business_unit_id: input.businessUnitId ?? null,
      source_event_id: input.sourceEventId ?? null,
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
      status: "draft",
      owner_id: input.userId,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "risk_assessment.created",
    entityType: "risk_assessment",
    entityId: data.id,
    newValues: { title: data.title, type: input.typeCode },
  });

  await supabase.from("risk_assessment_activity").insert({
    organization_id: input.organizationId,
    assessment_id: data.id,
    actor_user_id: input.userId,
    activity_type: "created",
    message: `Assessment ${data.assessment_number} created`,
  });

  return data;
}

export async function upsertHazard(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    assessmentId: string;
    hazardDescription: string;
    inherentLikelihood: number;
    inherentConsequence: number;
    residualLikelihood?: number;
    residualConsequence?: number;
    ownerId?: string;
    targetDate?: string;
    hazardId?: string;
    taskStep?: string;
    personsAtRisk?: string;
    existingControlsSummary?: string;
    additionalControlsSummary?: string;
    sortOrder?: number;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "risk.update");

  const { data: assessment } = await supabase
    .from("risk_assessments")
    .select("id, matrix_id, risk_matrices:matrix_id(bands)")
    .eq("id", input.assessmentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!assessment) throw new Error("Assessment not found");

  const bands = ((assessment.risk_matrices as { bands?: RiskBand[] } | null)?.bands ??
    []) as RiskBand[];
  const inherentScore = scoreRisk(input.inherentLikelihood, input.inherentConsequence);
  const residualScore =
    input.residualLikelihood != null && input.residualConsequence != null
      ? scoreRisk(input.residualLikelihood, input.residualConsequence)
      : null;

  const payload = {
    organization_id: input.organizationId,
    assessment_id: input.assessmentId,
    hazard_description: input.hazardDescription,
    task_step: input.taskStep ?? null,
    persons_at_risk: input.personsAtRisk ?? null,
    existing_controls_summary: input.existingControlsSummary ?? null,
    additional_controls_summary: input.additionalControlsSummary ?? null,
    sort_order: input.sortOrder ?? 0,
    inherent_likelihood: input.inherentLikelihood,
    inherent_consequence: input.inherentConsequence,
    inherent_score: inherentScore,
    inherent_band: resolveBand(inherentScore, bands),
    residual_likelihood: input.residualLikelihood ?? null,
    residual_consequence: input.residualConsequence ?? null,
    residual_score: residualScore,
    residual_band: residualScore != null ? resolveBand(residualScore, bands) : null,
    owner_id: input.ownerId ?? null,
    target_date: input.targetDate ?? null,
  };

  const query = input.hazardId
    ? supabase.from("risk_hazards").update(payload).eq("id", input.hazardId)
    : supabase.from("risk_hazards").insert(payload);

  const { data, error } = await query.select("*").single();
  if (error) throw new Error(error.message);

  await recomputeAssessmentScores(supabase, input.organizationId, input.assessmentId);
  await logRiskActivity(supabase, {
    organizationId: input.organizationId,
    assessmentId: input.assessmentId,
    actorUserId: input.userId,
    activityType: input.hazardId ? "hazard_updated" : "hazard_added",
    message: input.hazardId ? "Hazard updated" : `Hazard added: ${input.hazardDescription.slice(0, 80)}`,
  });

  return data;
}

export async function recomputeAssessmentScores(
  supabase: SupabaseClient,
  organizationId: string,
  assessmentId: string,
) {
  const { data: hazards } = await supabase
    .from("risk_hazards")
    .select("inherent_score, residual_score, inherent_band, residual_band")
    .eq("assessment_id", assessmentId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  const rows = hazards ?? [];
  const inherentMax = rows.reduce((m, h) => Math.max(m, h.inherent_score ?? 0), 0);
  const residualMax = rows.reduce((m, h) => Math.max(m, h.residual_score ?? 0), 0);
  const inherentBand =
    rows.find((h) => h.inherent_score === inherentMax)?.inherent_band ?? null;
  const residualBand =
    rows.find((h) => h.residual_score === residualMax)?.residual_band ?? null;

  await supabase
    .from("risk_assessments")
    .update({
      inherent_risk_score: inherentMax || null,
      inherent_risk_band: inherentBand,
      residual_risk_score: residualMax || null,
      residual_risk_band: residualBand,
    })
    .eq("id", assessmentId)
    .eq("organization_id", organizationId);
}

async function logRiskActivity(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    assessmentId: string;
    actorUserId: string;
    activityType: string;
    message: string;
    metadata?: Record<string, unknown>;
  },
) {
  await supabase.from("risk_assessment_activity").insert({
    organization_id: input.organizationId,
    assessment_id: input.assessmentId,
    actor_user_id: input.actorUserId,
    activity_type: input.activityType,
    message: input.message,
    metadata: input.metadata ?? {},
  });
}

export async function listRiskAssessments(
  supabase: SupabaseClient,
  organizationId: string,
  opts?: { typeCode?: string; status?: string; limit?: number },
) {
  let typeId: string | null = null;
  if (opts?.typeCode) {
    const { data: typeRow } = await supabase
      .from("risk_assessment_types")
      .select("id")
      .eq("code", opts.typeCode)
      .is("organization_id", null)
      .maybeSingle();
    typeId = typeRow?.id ?? null;
  }

  let query = supabase
    .from("risk_assessments")
    .select(
      `
      id, assessment_number, title, status, assessment_date, next_review_date,
      inherent_risk_band, residual_risk_band, inherent_risk_score, residual_risk_score,
      task_activity, sites:site_id(name),
      risk_assessment_types:assessment_type_id(code, name)
    `,
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 100);

  if (typeId) query = query.eq("assessment_type_id", typeId);
  if (opts?.status) query = query.eq("status", opts.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getRiskAssessmentBundle(
  supabase: SupabaseClient,
  organizationId: string,
  assessmentId: string,
) {
  const { data: assessment, error } = await supabase
    .from("risk_assessments")
    .select(
      `
      *,
      risk_assessment_types:assessment_type_id(code, name),
      risk_matrices:matrix_id(*),
      sites:site_id(name),
      projects:project_id(name)
    `,
    )
    .eq("id", assessmentId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!assessment) return null;

  const [hazards, team, steps, activity] = await Promise.all([
    supabase
      .from("risk_hazards")
      .select("*, risk_controls(*)")
      .eq("assessment_id", assessmentId)
      .is("deleted_at", null)
      .order("sort_order"),
    supabase
      .from("risk_assessment_team")
      .select("*")
      .eq("assessment_id", assessmentId),
    supabase
      .from("risk_assessment_steps")
      .select("*")
      .eq("assessment_id", assessmentId)
      .is("deleted_at", null)
      .order("sort_order"),
    supabase
      .from("risk_assessment_activity")
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return {
    assessment,
    hazards: hazards.data ?? [],
    team: team.data ?? [],
    steps: steps.data ?? [],
    activity: activity.data ?? [],
  };
}

export async function addTeamMember(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    assessmentId: string;
    memberUserId?: string;
    memberName?: string;
    roleLabel?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "risk.update");
  const { data, error } = await supabase
    .from("risk_assessment_team")
    .insert({
      organization_id: input.organizationId,
      assessment_id: input.assessmentId,
      user_id: input.memberUserId ?? null,
      member_name: input.memberName ?? null,
      role_label: input.roleLabel ?? "Assessor",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await logRiskActivity(supabase, {
    organizationId: input.organizationId,
    assessmentId: input.assessmentId,
    actorUserId: input.userId,
    activityType: "team_added",
    message: `Team member added: ${input.memberName ?? input.memberUserId ?? "member"}`,
  });
  return data;
}

export async function addAssessmentStep(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    assessmentId: string;
    stepName: string;
    description?: string;
    sortOrder?: number;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "risk.update");
  const { data, error } = await supabase
    .from("risk_assessment_steps")
    .insert({
      organization_id: input.organizationId,
      assessment_id: input.assessmentId,
      step_name: input.stepName,
      description: input.description ?? null,
      sort_order: input.sortOrder ?? 0,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateRiskMatrix(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    matrixId: string;
    name?: string;
    bands?: RiskBand[];
    likelihoodLabels?: string[];
    consequenceLabels?: string[];
    likelihoodMax?: number;
    consequenceMax?: number;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "risk.update");
  const patch: Record<string, unknown> = {};
  if (input.name) patch.name = input.name;
  if (input.bands) patch.bands = input.bands;
  if (input.likelihoodLabels) patch.likelihood_labels = input.likelihoodLabels;
  if (input.consequenceLabels) patch.consequence_labels = input.consequenceLabels;
  if (input.likelihoodMax) patch.likelihood_max = input.likelihoodMax;
  if (input.consequenceMax) patch.consequence_max = input.consequenceMax;

  const { data, error } = await supabase
    .from("risk_matrices")
    .update(patch)
    .eq("id", input.matrixId)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "risk_matrix.updated",
    entityType: "risk_matrix",
    entityId: input.matrixId,
    newValues: patch,
  });
  return data;
}

export async function getRiskRegister(
  supabase: SupabaseClient,
  organizationId: string,
  opts?: { siteId?: string; band?: string },
) {
  let query = supabase
    .from("risk_hazards")
    .select(
      `
      id, hazard_description, inherent_score, inherent_band, residual_score, residual_band,
      status, target_date, owner_id,
      risk_assessments!inner(
        id, assessment_number, title, status, site_id, organization_id,
        risk_assessment_types:assessment_type_id(code, name)
      )
    `,
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("residual_score", { ascending: false, nullsFirst: false })
    .limit(200);

  if (opts?.band) query = query.eq("residual_band", opts.band);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  let rows = data ?? [];
  if (opts?.siteId) {
    rows = rows.filter(
      (r) =>
        (r.risk_assessments as { site_id?: string } | null)?.site_id === opts.siteId,
    );
  }
  return rows;
}

export async function createRiskFromReport(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    eventId: string;
    typeCode?: "risk_assessment" | "jsa" | "jha";
  },
) {
  const { data: event } = await supabase
    .from("ehs_events")
    .select("id, title, description, site_id, project_id, event_number")
    .eq("id", input.eventId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!event) throw new Error("Source report not found");

  const assessment = await createRiskAssessment(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    typeCode: input.typeCode ?? "risk_assessment",
    title: `Risk review: ${event.event_number}`,
    taskActivity: event.title || event.description?.slice(0, 200),
    siteId: event.site_id ?? undefined,
    projectId: event.project_id ?? undefined,
    sourceEventId: event.id,
  });

  return assessment;
}

export async function addControlAndOptionalCapa(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    hazardId: string;
    hierarchy: (typeof HIERARCHY_OF_CONTROLS)[number];
    description: string;
    controlType: "existing" | "additional";
    createCapa?: boolean;
    capaTitle?: string;
    dueDate?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "risk.update");

  let capaId: string | null = null;
  if (input.createCapa) {
    const capa = await createCapa(supabase, {
      organizationId: input.organizationId,
      userId: input.userId,
      sourceModule: "risk_assessment",
      sourceRecordId: input.hazardId,
      title: input.capaTitle || `Control: ${input.description.slice(0, 80)}`,
      description: input.description,
      dueDate: input.dueDate,
    });
    capaId = capa.id;
  }

  const { data, error } = await supabase
    .from("risk_controls")
    .insert({
      organization_id: input.organizationId,
      hazard_id: input.hazardId,
      control_type: input.controlType,
      hierarchy: input.hierarchy,
      description: input.description,
      capa_id: capaId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function transitionRiskAssessment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    assessmentId: string;
    toStatus: string;
  },
) {
  const { data: current } = await supabase
    .from("risk_assessments")
    .select("*")
    .eq("id", input.assessmentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!current) throw new Error("Assessment not found");
  if (!canTransitionRisk(current.status, input.toStatus)) {
    throw new Error(`Cannot transition from ${current.status} to ${input.toStatus}`);
  }
  if (input.toStatus === "approval" || input.toStatus === "active") {
    await requirePermission(supabase, input.organizationId, input.userId, "risk.approve");
  } else {
    await requirePermission(supabase, input.organizationId, input.userId, "risk.update");
  }

  const patch: Record<string, unknown> = {
    status: input.toStatus,
    updated_by: input.userId,
  };
  if (input.toStatus === "active") {
    patch.approved_by = input.userId;
    patch.approved_at = new Date().toISOString();
  }
  if (input.toStatus === "periodic_review" || input.toStatus === "active") {
    if (current.status === "periodic_review" && input.toStatus === "active") {
      patch.last_reviewed_at = new Date().toISOString();
      patch.last_reviewed_by = input.userId;
    }
  }

  const { data, error } = await supabase
    .from("risk_assessments")
    .update(patch)
    .eq("id", input.assessmentId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "risk_assessment.status_changed",
    entityType: "risk_assessment",
    entityId: input.assessmentId,
    previousValues: { status: current.status },
    newValues: { status: input.toStatus },
  });

  await supabase.from("risk_assessment_activity").insert({
    organization_id: input.organizationId,
    assessment_id: input.assessmentId,
    actor_user_id: input.userId,
    activity_type: "status_change",
    message: `Status ${current.status} → ${input.toStatus}`,
    metadata: { from: current.status, to: input.toStatus },
  });

  return data;
}
