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
  return data;
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

  const { data, error } = await supabase
    .from("risk_assessments")
    .update(patch)
    .eq("id", input.assessmentId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}
