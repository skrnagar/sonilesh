"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import {
  addAssessmentStep,
  addControlAndOptionalCapa,
  addTeamMember,
  createRiskAssessment,
  createRiskFromReport,
  transitionRiskAssessment,
  updateRiskMatrix,
  upsertHazard,
  HIERARCHY_OF_CONTROLS,
} from "@/lib/services/risk";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/events";

function failed(err: unknown): ActionResult {
  return { ok: false, error: formatSupabaseUserError(err) };
}

export async function createRiskAssessmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const typeCode = String(formData.get("typeCode") || "risk_assessment") as
      | "risk_assessment"
      | "jsa"
      | "jha";
    const title = String(formData.get("title") || "").trim();
    if (title.length < 2) return { ok: false, error: "Title required" };

    const row = await createRiskAssessment(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      typeCode,
      title,
      taskActivity: String(formData.get("taskActivity") || "") || undefined,
      siteId: String(formData.get("siteId") || "") || undefined,
      projectId: String(formData.get("projectId") || "") || undefined,
      nextReviewDate: String(formData.get("nextReviewDate") || "") || undefined,
      sourceEventId: String(formData.get("sourceEventId") || "") || undefined,
    });

    revalidatePath("/app/risk-assessments");
    revalidatePath("/app/jsa");
    revalidatePath("/app/jha");
    revalidatePath("/app/risk-register");
    return { ok: true, id: row.id, href: `/app/risk-assessments/${row.id}` };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function upsertHazardAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const assessmentId = String(formData.get("assessmentId") || "");
    await upsertHazard(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      assessmentId,
      hazardId: String(formData.get("hazardId") || "") || undefined,
      hazardDescription: String(formData.get("hazardDescription") || ""),
      taskStep: String(formData.get("taskStep") || "") || undefined,
      personsAtRisk: String(formData.get("personsAtRisk") || "") || undefined,
      existingControlsSummary: String(formData.get("existingControls") || "") || undefined,
      additionalControlsSummary: String(formData.get("additionalControls") || "") || undefined,
      inherentLikelihood: Number(formData.get("inherentLikelihood") || 1),
      inherentConsequence: Number(formData.get("inherentConsequence") || 1),
      residualLikelihood: formData.get("residualLikelihood")
        ? Number(formData.get("residualLikelihood"))
        : undefined,
      residualConsequence: formData.get("residualConsequence")
        ? Number(formData.get("residualConsequence"))
        : undefined,
      targetDate: String(formData.get("targetDate") || "") || undefined,
    });
    revalidatePath(`/app/risk-assessments/${assessmentId}`);
    revalidatePath("/app/risk-register");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function addControlAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const hierarchy = String(formData.get("hierarchy") || "administrative");
    if (!HIERARCHY_OF_CONTROLS.includes(hierarchy as (typeof HIERARCHY_OF_CONTROLS)[number])) {
      return { ok: false, error: "Invalid hierarchy of controls value" };
    }
    await addControlAndOptionalCapa(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      hazardId: String(formData.get("hazardId") || ""),
      hierarchy: hierarchy as (typeof HIERARCHY_OF_CONTROLS)[number],
      description: String(formData.get("description") || ""),
      controlType: String(formData.get("controlType") || "additional") as
        | "existing"
        | "additional",
      createCapa: formData.get("createCapa") === "on",
      capaTitle: String(formData.get("capaTitle") || "") || undefined,
      dueDate: String(formData.get("dueDate") || "") || undefined,
    });
    const assessmentId = String(formData.get("assessmentId") || "");
    revalidatePath(`/app/risk-assessments/${assessmentId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function transitionRiskAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const assessmentId = String(formData.get("assessmentId") || "");
    await transitionRiskAssessment(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      assessmentId,
      toStatus: String(formData.get("toStatus") || ""),
    });
    revalidatePath(`/app/risk-assessments/${assessmentId}`);
    revalidatePath("/app/risk-assessments");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function addTeamMemberAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const assessmentId = String(formData.get("assessmentId") || "");
    await addTeamMember(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      assessmentId,
      memberName: String(formData.get("memberName") || "") || undefined,
      roleLabel: String(formData.get("roleLabel") || "") || undefined,
    });
    revalidatePath(`/app/risk-assessments/${assessmentId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function addStepAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const assessmentId = String(formData.get("assessmentId") || "");
    await addAssessmentStep(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      assessmentId,
      stepName: String(formData.get("stepName") || ""),
      description: String(formData.get("description") || "") || undefined,
      sortOrder: Number(formData.get("sortOrder") || 0),
    });
    revalidatePath(`/app/risk-assessments/${assessmentId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function updateMatrixAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    await updateRiskMatrix(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      matrixId: String(formData.get("matrixId") || ""),
      name: String(formData.get("name") || "") || undefined,
      likelihoodMax: formData.get("likelihoodMax")
        ? Number(formData.get("likelihoodMax"))
        : undefined,
      consequenceMax: formData.get("consequenceMax")
        ? Number(formData.get("consequenceMax"))
        : undefined,
    });
    revalidatePath("/app/settings/ehs/risk-matrix");
    revalidatePath("/app/risk-assessments");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function createRiskFromReportAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const row = await createRiskFromReport(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      eventId: String(formData.get("eventId") || ""),
      typeCode: (String(formData.get("typeCode") || "risk_assessment") as
        | "risk_assessment"
        | "jsa"
        | "jha"),
    });
    revalidatePath("/app/risk-assessments");
    return { ok: true, id: row.id, href: `/app/risk-assessments/${row.id}` };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}
