"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/events";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import {
  addTaskEvidence,
  evaluateApplicability,
  markTaskFiled,
  overrideApplicability,
  upsertComplianceProfile,
  verifyTaskFiling,
} from "@/lib/services/compliance";
import { WASTE_STREAMS } from "@/lib/compliance/applicability";

function failed(err: unknown): ActionResult {
  return { ok: false, error: formatSupabaseUserError(err) };
}

export async function saveComplianceProfileAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "regulatory_compliance",
      permission: "compliance.manage",
    });
    if (!access.entitled) return { ok: false, error: "Upgrade required for regulatory compliance." };
    if (!access.permitted) return { ok: false, error: "Missing permission: compliance.manage" };

    const waste = WASTE_STREAMS.filter((stream) => formData.get(`waste_${stream}`) === "on");
    const states = String(formData.get("states") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const sub = String(formData.get("subSectors") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await upsertComplianceProfile(access.supabase, access.organization.id, access.user.id, {
      industry_sector: String(formData.get("industrySector") || "") || null,
      sub_sectors: sub,
      is_listed: formData.get("isListed") === "on",
      market_cap_rank: formData.get("marketCapRank")
        ? Number(formData.get("marketCapRank"))
        : null,
      turnover_band: String(formData.get("turnoverBand") || "") || null,
      net_worth_band: String(formData.get("netWorthBand") || "") || null,
      net_profit_band: String(formData.get("netProfitBand") || "") || null,
      employee_count_band: String(formData.get("employeeBand") || "") || null,
      states_of_operation: states,
      exports_to_eu: formData.get("exportsToEu") === "on",
      waste_streams_generated: waste,
      ccts_sector: formData.get("cctsSector") === "on",
      country_code: String(formData.get("countryCode") || "") || null,
      jurisdiction_codes: String(formData.get("jurisdictionCodes") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      site_types: String(formData.get("siteTypes") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      auto_noncompliant_on_expired_evidence: formData.get("autoNoncompliant") === "on",
    });

    revalidatePath("/app/settings/compliance-profile");
    revalidatePath("/app/compliance");
    return { ok: true, href: "/app/settings/compliance-profile" };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function reevaluateApplicabilityAction(): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "regulatory_compliance",
      permission: "compliance.manage",
    });
    if (!access.entitled || !access.permitted) return { ok: false, error: "Not allowed" };
    await evaluateApplicability(access.supabase, access.organization.id, access.user.id);
    revalidatePath("/app/settings/compliance-profile");
    revalidatePath("/app/compliance");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function excludeObligationAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "regulatory_compliance",
      permission: "compliance.manage",
    });
    if (!access.entitled || !access.permitted) return { ok: false, error: "Not allowed" };
    await overrideApplicability(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      applicableId: String(formData.get("applicableId") || ""),
      status: "manually_excluded",
      justification: String(formData.get("justification") || ""),
    });
    revalidatePath("/app/settings/compliance-profile");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function addObligationAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "regulatory_compliance",
      permission: "compliance.manage",
    });
    if (!access.entitled || !access.permitted) return { ok: false, error: "Not allowed" };
    await overrideApplicability(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      obligationId: String(formData.get("obligationId") || ""),
      status: "manually_added",
      justification: String(formData.get("justification") || ""),
    });
    revalidatePath("/app/settings/compliance-profile");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function fileComplianceTaskAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "regulatory_compliance",
      permission: "compliance.manage",
    });
    if (!access.entitled || !access.permitted) return { ok: false, error: "Not allowed" };
    const taskId = String(formData.get("taskId") || "");
    await markTaskFiled(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      taskId,
      notes: String(formData.get("notes") || "") || undefined,
    });
    const evidence = String(formData.get("evidenceUrl") || "").trim();
    if (evidence) {
      await addTaskEvidence(access.supabase, {
        organizationId: access.organization.id,
        userId: access.user.id,
        taskId,
        storagePath: evidence,
        fileName: evidence.split("/").pop() || "evidence",
      });
    }
    revalidatePath(`/app/compliance/tasks/${taskId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function verifyComplianceTaskAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "regulatory_compliance",
      permission: "compliance.verify",
    });
    if (!access.entitled || !access.permitted) return { ok: false, error: "Not allowed" };
    const taskId = String(formData.get("taskId") || "");
    await verifyTaskFiling(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      taskId,
    });
    revalidatePath(`/app/compliance/tasks/${taskId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function createAssessmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "regulatory_compliance",
      permission: "compliance.assess",
    });
    if (!access.entitled || !access.permitted) return { ok: false, error: "Not allowed" };
    const { createComplianceAssessment } = await import("@/lib/services/compliance");
    const row = await createComplianceAssessment(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      requirementId: String(formData.get("requirementId") || ""),
      periodLabel: String(formData.get("periodLabel") || "current"),
      templateId: String(formData.get("templateId") || "") || null,
    });
    revalidatePath("/app/compliance/assessments");
    if (row.checklist_assignment_id) {
      return { ok: true, href: `/app/inspections/${row.checklist_assignment_id}` };
    }
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function snapshotAssessmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "regulatory_compliance",
      permission: "compliance.assess",
    });
    if (!access.entitled || !access.permitted) return { ok: false, error: "Not allowed" };
    const { snapshotAssessmentFromChecklist } = await import("@/lib/services/compliance");
    await snapshotAssessmentFromChecklist(access.supabase, {
      organizationId: access.organization.id,
      assessmentId: String(formData.get("assessmentId") || ""),
      userId: access.user.id,
    });
    revalidatePath("/app/compliance/assessments");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}
