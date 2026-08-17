"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/events";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import {
  addGhgRow,
  refreshHealthSafetyMetric,
  saveBrsrReport,
  upsertCommitteeMember,
  upsertEpr,
  upsertEsgMetric,
  upsertMateriality,
} from "@/lib/services/esg";

function failed(err: unknown): ActionResult {
  return { ok: false, error: formatSupabaseUserError(err) };
}

async function esgWrite() {
  const access = await requireModuleAccess({
    featureCode: "esg_reporting",
    permission: "esg.manage",
  });
  if (!access.entitled) throw new Error("ESG reporting is not enabled for this organization.");
  if (!access.permitted) throw new Error("Missing permission: esg.manage");
  return access;
}

export async function saveCommitteeMemberAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await esgWrite();
    await upsertCommitteeMember(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      memberUserId: String(formData.get("memberUserId") || ""),
      role: String(formData.get("role") || "member"),
    });
    revalidatePath("/app/esg/committee");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function saveMaterialityAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await esgWrite();
    await upsertMateriality(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      year: Number(formData.get("year") || new Date().getFullYear()),
      topic: String(formData.get("topic") || "").trim(),
      stakeholderScore: Number(formData.get("stakeholderScore") || 1),
      businessImpactScore: Number(formData.get("businessImpactScore") || 1),
      notes: String(formData.get("notes") || "") || undefined,
    });
    revalidatePath("/app/esg/materiality");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function saveGhgAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await esgWrite();
    await addGhgRow(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      siteId: String(formData.get("siteId") || "") || null,
      periodStart: String(formData.get("periodStart") || ""),
      periodEnd: String(formData.get("periodEnd") || ""),
      scope: String(formData.get("scope") || "1") as "1" | "2" | "3",
      category: String(formData.get("category") || "") || undefined,
      valueTco2e: Number(formData.get("valueTco2e") || 0),
      sourceDataRef: String(formData.get("sourceDataRef") || "") || undefined,
    });
    revalidatePath("/app/esg/ghg-inventory");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function saveEsgMetricAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await esgWrite();
    const key = String(formData.get("metricKey") || "");
    const period = String(formData.get("period") || "");
    if (key === "employee_health_safety") {
      const start = String(formData.get("periodStart") || `${period}-04-01`);
      const end = String(formData.get("periodEnd") || `${Number(period.slice(0, 4)) + 1}-03-31`);
      await refreshHealthSafetyMetric(
        access.supabase,
        access.organization.id,
        access.user.id,
        period,
        start,
        end,
      );
    } else {
      await upsertEsgMetric(access.supabase, {
        organizationId: access.organization.id,
        userId: access.user.id,
        period,
        metricKey: key,
        value: formData.get("value") ? Number(formData.get("value")) : null,
        unit: String(formData.get("unit") || "") || undefined,
        notes: String(formData.get("notes") || "") || undefined,
      });
    }
    revalidatePath("/app/esg/metrics");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function saveEprAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await esgWrite();
    await upsertEpr(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      wasteStream: String(formData.get("wasteStream") || ""),
      registrationStatus: String(formData.get("registrationStatus") || "not_registered"),
      annualTarget: formData.get("annualTarget") ? Number(formData.get("annualTarget")) : null,
      annualActual: formData.get("annualActual") ? Number(formData.get("annualActual")) : null,
      renewalDue: String(formData.get("renewalDue") || "") || null,
      certificatePath: String(formData.get("certificatePath") || "") || null,
    });
    revalidatePath("/app/esg/epr");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function saveBrsrAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await esgWrite();
    const financialYear = String(formData.get("financialYear") || "");
    const sectionA = JSON.parse(String(formData.get("sectionA") || "{}")) as Record<string, unknown>;
    const sectionC = JSON.parse(String(formData.get("sectionC") || "{}")) as Record<string, unknown>;
    const sectionB: Record<string, { has_policy: string; disclosure: string }> = {};
    for (const code of ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"]) {
      sectionB[code] = {
        has_policy: String(formData.get(`b_${code}_policy`) || "no"),
        disclosure: String(formData.get(`b_${code}_text`) || ""),
      };
    }
    await saveBrsrReport(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      financialYear,
      sectionA,
      sectionB,
      sectionC,
      status: "draft",
    });
    revalidatePath("/app/esg/brsr-report");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function saveMetricDefinitionAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await esgWrite();
    const { upsertMetricDefinition } = await import("@/lib/services/esg");
    await upsertMetricDefinition(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      code: String(formData.get("code") || ""),
      name: String(formData.get("name") || ""),
      unit: String(formData.get("unit") || "") || undefined,
    });
    revalidatePath("/app/esg/definitions");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function saveReportingPeriodAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await esgWrite();
    const { ensureReportingPeriod } = await import("@/lib/services/esg");
    await ensureReportingPeriod(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      periodLabel: String(formData.get("periodLabel") || ""),
      periodStart: String(formData.get("periodStart") || "") || null,
      periodEnd: String(formData.get("periodEnd") || "") || null,
    });
    revalidatePath("/app/esg/periods");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}
