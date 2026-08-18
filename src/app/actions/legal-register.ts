"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/events";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import {
  upsertRequirement,
  upsertLegalRegisterEntry,
} from "@/lib/services/legal-register";
import {
  addPermitCondition,
  createRegulatoryUpdate,
  recordUpdateImpact,
  upsertRegulatoryPermit,
} from "@/lib/services/regulatory";

function failed(err: unknown): ActionResult {
  return { ok: false, error: formatSupabaseUserError(err) };
}

export async function saveLegalRegisterAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "legal_register",
      permission: "legal_register.manage",
    });
    if (!access.entitled) return { ok: false, error: "Upgrade required for legal register." };
    if (!access.permitted) return { ok: false, error: "Missing permission: legal_register.manage" };
    await upsertLegalRegisterEntry(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      title: String(formData.get("title") || ""),
      siteId: String(formData.get("siteId") || "") || null,
      regulationId: String(formData.get("regulationId") || "") || null,
      ownerId: String(formData.get("ownerId") || "") || null,
      justification: String(formData.get("justification") || "") || undefined,
    });
    revalidatePath("/app/compliance/legal-register");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function saveRequirementAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "legal_register",
      permission: "legal_register.manage",
    });
    if (!access.entitled || !access.permitted) return { ok: false, error: "Not allowed" };
    await upsertRequirement(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      legalRegisterEntryId: String(formData.get("legalRegisterEntryId") || ""),
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || "") || undefined,
      frequency: String(formData.get("frequency") || "annual"),
      siteId: String(formData.get("siteId") || "") || null,
      checklistTemplateId: String(formData.get("templateId") || "") || null,
      trainingCourseId: String(formData.get("trainingCourseId") || "") || null,
      contractorCompanyId: String(formData.get("contractorCompanyId") || "") || null,
      mocRequestId: String(formData.get("mocRequestId") || "") || null,
      riskAssessmentId: String(formData.get("riskAssessmentId") || "") || null,
    });
    revalidatePath("/app/compliance/requirements");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function saveLicenseAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "regulatory_compliance",
      permission: "regulatory_permits.manage",
    });
    if (!access.entitled || !access.permitted) return { ok: false, error: "Not allowed" };
    await upsertRegulatoryPermit(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      name: String(formData.get("name") || ""),
      licenseNumber: String(formData.get("licenseNumber") || "") || undefined,
      issuingAuthority: String(formData.get("issuingAuthority") || "") || undefined,
      siteId: String(formData.get("siteId") || "") || null,
      issuedOn: String(formData.get("issuedOn") || "") || null,
      expiresOn: String(formData.get("expiresOn") || "") || null,
      notes: String(formData.get("notes") || "") || undefined,
    });
    revalidatePath("/app/compliance/licenses");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function saveLicenseConditionAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "regulatory_compliance",
      permission: "regulatory_permits.manage",
    });
    if (!access.entitled || !access.permitted) return { ok: false, error: "Not allowed" };
    await addPermitCondition(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      permitId: String(formData.get("permitId") || ""),
      conditionText: String(formData.get("conditionText") || ""),
      dueDate: String(formData.get("dueDate") || "") || null,
    });
    revalidatePath("/app/compliance/licenses");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function saveRegulatoryUpdateAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "legal_register",
      permission: "legal_register.manage",
    });
    if (!access.entitled || !access.permitted) return { ok: false, error: "Not allowed" };
    await createRegulatoryUpdate(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      title: String(formData.get("title") || ""),
      summary: String(formData.get("summary") || "") || undefined,
      publishedOn: String(formData.get("publishedOn") || "") || null,
      sourceUrl: String(formData.get("sourceUrl") || "") || null,
    });
    revalidatePath("/app/compliance/reviews");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function saveUpdateImpactAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "legal_register",
      permission: "legal_register.manage",
    });
    if (!access.entitled || !access.permitted) return { ok: false, error: "Not allowed" };
    await recordUpdateImpact(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      updateId: String(formData.get("updateId") || ""),
      legalRegisterEntryId: String(formData.get("legalRegisterEntryId") || "") || null,
      impactStatus: String(formData.get("impactStatus") || "pending_review") as
        | "pending_review"
        | "applicable"
        | "not_applicable"
        | "actioned",
      notes: String(formData.get("notes") || "") || undefined,
    });
    revalidatePath("/app/compliance/reviews");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function raiseLicenseConditionFindingAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "regulatory_compliance",
      permission: "regulatory_permits.manage",
    });
    if (!access.entitled || !access.permitted) return { ok: false, error: "Not allowed" };
    const { raisePermitConditionFinding } = await import("@/lib/services/regulatory");
    await raisePermitConditionFinding(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      conditionId: String(formData.get("conditionId") || ""),
    });
    revalidatePath("/app/compliance/licenses");
    revalidatePath("/app/findings");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}
