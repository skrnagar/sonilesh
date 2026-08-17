"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { requireOrgContext } from "@/lib/auth/org-context";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/events";
import {
  addContractorContact,
  approveProjectAssignment,
  approveSiteAssignment,
  approveWorkerAssignment,
  assignContractorWorker,
  createContractorAssessment,
  createContractorCompany,
  createContractorContract,
  createContractorWorker,
  createInduction,
  inviteContractorContact,
  recordContractorPerformance,
  recordInduction,
  requestProjectAssignment,
  requestSiteAssignment,
  scorePrequalification,
  startPrequalification,
  transitionContractorStatus,
  uploadContractorDocument,
  upsertContractorCategory,
  upsertContractorSettings,
  verifyContractorDocument,
} from "@/lib/services/contractors";

function failed(err: unknown): ActionResult {
  return { ok: false, error: formatSupabaseUserError(err) };
}

function revalidateContractor(companyId?: string) {
  revalidatePath("/app/contractors");
  revalidatePath("/app/contractors/dashboard");
  revalidatePath("/app/contractors/readiness");
  if (companyId) revalidatePath(`/app/contractors/${companyId}`);
}

export async function createContractorCompanyAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const name = String(formData.get("name") || "").trim();
    if (!name) return { ok: false, error: "Company name is required" };
    const row = await createContractorCompany(supabase, {
      organizationId: organization.id,
      userId: user.id,
      name,
      legalName: String(formData.get("legalName") || "") || undefined,
      gstin: String(formData.get("gstin") || "") || undefined,
      pan: String(formData.get("pan") || "") || undefined,
      email: String(formData.get("email") || "") || undefined,
      phone: String(formData.get("phone") || "") || undefined,
      city: String(formData.get("city") || "") || undefined,
      state: String(formData.get("state") || "") || undefined,
      categoryId: String(formData.get("categoryId") || "") || undefined,
      notes: String(formData.get("notes") || "") || undefined,
    });
    revalidateContractor(row.id);
    return { ok: true, href: `/app/contractors/${row.id}`, id: row.id };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function transitionContractorAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await transitionContractorStatus(supabase, {
      organizationId: organization.id,
      userId: user.id,
      companyId: String(formData.get("companyId") || ""),
      toStatus: String(formData.get("toStatus") || ""),
      reason: String(formData.get("reason") || "") || undefined,
    });
    revalidateContractor(String(formData.get("companyId") || ""));
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function addContractorContactAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await addContractorContact(supabase, {
      organizationId: organization.id,
      userId: user.id,
      companyId: String(formData.get("companyId") || ""),
      fullName: String(formData.get("fullName") || ""),
      email: String(formData.get("email") || "") || undefined,
      phone: String(formData.get("phone") || "") || undefined,
      roleTitle: String(formData.get("roleTitle") || "") || undefined,
      isPrimary: formData.get("isPrimary") === "on",
    });
    revalidateContractor(String(formData.get("companyId") || ""));
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function inviteContractorContactAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const result = await inviteContractorContact(supabase, {
      organizationId: organization.id,
      userId: user.id,
      companyId: String(formData.get("companyId") || ""),
      email: String(formData.get("email") || ""),
      fullName: String(formData.get("fullName") || "") || undefined,
      contactId: String(formData.get("contactId") || "") || undefined,
    });
    const companyId = String(formData.get("companyId") || "");
    revalidateContractor(companyId);
    return {
      ok: true,
      href: `/app/contractors/${companyId}?tab=overview&inviteToken=${encodeURIComponent(result.token)}`,
    };
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const row = await startPrequalification(supabase, {
      organizationId: organization.id,
      userId: user.id,
      companyId: String(formData.get("companyId") || ""),
      templateId: String(formData.get("templateId") || "") || undefined,
    });
    revalidateContractor(String(formData.get("companyId") || ""));
    return { ok: true, href: `/app/inspections/${row.assignment.id}` };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function scorePrequalificationAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await scorePrequalification(supabase, {
      organizationId: organization.id,
      userId: user.id,
      prequalificationId: String(formData.get("prequalificationId") || ""),
      scorePercent: Number(formData.get("scorePercent") || 0),
    });
    revalidateContractor(String(formData.get("companyId") || ""));
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function createContractorContractAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await createContractorContract(supabase, {
      organizationId: organization.id,
      userId: user.id,
      companyId: String(formData.get("companyId") || ""),
      title: String(formData.get("title") || ""),
      contractNumber: String(formData.get("contractNumber") || "") || undefined,
      startsOn: String(formData.get("startsOn") || "") || undefined,
      endsOn: String(formData.get("endsOn") || "") || undefined,
    });
    revalidateContractor(String(formData.get("companyId") || ""));
    revalidatePath("/app/contractors/contracts");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function requestSiteAssignmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await requestSiteAssignment(supabase, {
      organizationId: organization.id,
      userId: user.id,
      companyId: String(formData.get("companyId") || ""),
      siteId: String(formData.get("siteId") || ""),
      validFrom: String(formData.get("validFrom") || "") || undefined,
      validUntil: String(formData.get("validUntil") || "") || undefined,
    });
    revalidateContractor(String(formData.get("companyId") || ""));
    revalidatePath("/app/contractors/assignments");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function approveSiteAssignmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await approveSiteAssignment(supabase, {
      organizationId: organization.id,
      userId: user.id,
      assignmentId: String(formData.get("assignmentId") || ""),
      decision: String(formData.get("decision") || "approved") as "approved" | "rejected",
    });
    revalidatePath("/app/contractors/assignments");
    revalidateContractor(String(formData.get("companyId") || ""));
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function requestProjectAssignmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await requestProjectAssignment(supabase, {
      organizationId: organization.id,
      userId: user.id,
      companyId: String(formData.get("companyId") || ""),
      projectId: String(formData.get("projectId") || ""),
    });
    revalidatePath("/app/contractors/assignments");
    revalidateContractor(String(formData.get("companyId") || ""));
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function approveProjectAssignmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await approveProjectAssignment(supabase, {
      organizationId: organization.id,
      userId: user.id,
      assignmentId: String(formData.get("assignmentId") || ""),
      decision: String(formData.get("decision") || "approved") as "approved" | "rejected",
    });
    revalidatePath("/app/contractors/assignments");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function createContractorWorkerAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await createContractorWorker(supabase, {
      organizationId: organization.id,
      userId: user.id,
      companyId: String(formData.get("companyId") || ""),
      fullName: String(formData.get("fullName") || ""),
      employeeNumber: String(formData.get("employeeNumber") || "") || undefined,
      trade: String(formData.get("trade") || "") || undefined,
      profileId: String(formData.get("profileId") || "") || undefined,
      email: String(formData.get("email") || "") || undefined,
    });
    revalidateContractor(String(formData.get("companyId") || ""));
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function assignContractorWorkerAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await assignContractorWorker(supabase, {
      organizationId: organization.id,
      userId: user.id,
      workerId: String(formData.get("workerId") || ""),
      siteId: String(formData.get("siteId") || "") || undefined,
      projectId: String(formData.get("projectId") || "") || undefined,
    });
    revalidatePath("/app/contractors/assignments");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function approveWorkerAssignmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await approveWorkerAssignment(supabase, {
      organizationId: organization.id,
      userId: user.id,
      assignmentId: String(formData.get("assignmentId") || ""),
      decision: String(formData.get("decision") || "approved") as "approved" | "rejected",
    });
    revalidatePath("/app/contractors/assignments");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function createInductionAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await createInduction(supabase, {
      organizationId: organization.id,
      userId: user.id,
      title: String(formData.get("title") || ""),
      siteId: String(formData.get("siteId") || "") || undefined,
      validityDays: Number(formData.get("validityDays") || 0) || undefined,
    });
    revalidatePath("/app/contractors/inductions");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function recordInductionAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await recordInduction(supabase, {
      organizationId: organization.id,
      userId: user.id,
      inductionId: String(formData.get("inductionId") || ""),
      workerId: String(formData.get("workerId") || ""),
    });
    revalidatePath("/app/contractors/inductions");
    revalidatePath("/app/contractors/readiness");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function createContractorAssessmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const row = await createContractorAssessment(supabase, {
      organizationId: organization.id,
      userId: user.id,
      companyId: String(formData.get("companyId") || ""),
      templateId: String(formData.get("templateId") || ""),
      title: String(formData.get("title") || "Contractor assessment"),
      workerId: String(formData.get("workerId") || "") || undefined,
      siteId: String(formData.get("siteId") || "") || undefined,
    });
    revalidatePath("/app/contractors/assessments");
    return { ok: true, href: `/app/inspections/${row.assignment.id}` };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function recordPerformanceAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await recordContractorPerformance(supabase, {
      organizationId: organization.id,
      userId: user.id,
      companyId: String(formData.get("companyId") || ""),
      siteId: String(formData.get("siteId") || "") || undefined,
      safetyScore: Number(formData.get("safetyScore") || "") || undefined,
      incidentsCount: Number(formData.get("incidentsCount") || 0) || undefined,
      findingsCount: Number(formData.get("findingsCount") || 0) || undefined,
      capaOpenCount: Number(formData.get("capaOpenCount") || 0) || undefined,
      notes: String(formData.get("notes") || "") || undefined,
    });
    revalidatePath("/app/contractors/performance");
    revalidateContractor(String(formData.get("companyId") || ""));
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function uploadContractorDocumentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const file = formData.get("file");
    await uploadContractorDocument(supabase, {
      organizationId: organization.id,
      userId: user.id,
      companyId: String(formData.get("companyId") || ""),
      workerId: String(formData.get("workerId") || "") || undefined,
      docType: String(formData.get("docType") || "other"),
      title: String(formData.get("title") || "Document"),
      expiresOn: String(formData.get("expiresOn") || "") || undefined,
      isMandatory: formData.get("isMandatory") === "on",
      file: file instanceof File && file.size > 0 ? file : undefined,
    });
    revalidateContractor(String(formData.get("companyId") || ""));
    revalidatePath("/contractor");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function verifyContractorDocumentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await verifyContractorDocument(supabase, {
      organizationId: organization.id,
      userId: user.id,
      documentId: String(formData.get("documentId") || ""),
      decision: String(formData.get("decision") || "verified") as "verified" | "rejected",
      notes: String(formData.get("notes") || "") || undefined,
    });
    revalidateContractor(String(formData.get("companyId") || ""));
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function upsertContractorCategoryAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await upsertContractorCategory(supabase, {
      organizationId: organization.id,
      userId: user.id,
      id: String(formData.get("id") || "") || undefined,
      code: String(formData.get("code") || ""),
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || "") || undefined,
    });
    revalidatePath("/app/settings/contractors/categories");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function upsertContractorSettingsAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const passRaw = String(formData.get("prequalPassPercent") || "").trim();
    const condRaw = String(formData.get("prequalConditionalPercent") || "").trim();
    const types = String(formData.get("mandatoryDocTypes") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await upsertContractorSettings(supabase, {
      organizationId: organization.id,
      userId: user.id,
      prequalPassPercent: passRaw ? Number(passRaw) : null,
      prequalConditionalPercent: condRaw ? Number(condRaw) : null,
      enforceMandatoryDocs: formData.get("enforceMandatoryDocs") === "on",
      ptwEnforceReadiness: formData.get("ptwEnforceReadiness") === "on",
      inductionRequired: formData.get("inductionRequired") === "on",
      mandatoryDocTypes: types,
    });
    revalidatePath("/app/settings/contractors/categories");
    revalidatePath("/app/contractors/dashboard");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}
