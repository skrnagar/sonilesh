"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import {
  addPermitComment,
  addPermitWorker,
  completeCloseout,
  createPermit,
  decideExtension,
  decidePermitApproval,
  linkRiskToPermit,
  requestExtension,
  resumePermit,
  startCloseout,
  suspendPermit,
  transitionPermit,
  updateChecklistItem,
  upsertIsolation,
  ISOLATION_TYPES,
} from "@/lib/services/permits";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/events";

function failed(err: unknown): ActionResult {
  return { ok: false, error: formatSupabaseUserError(err) };
}

function revalidatePermit(id: string) {
  revalidatePath("/app/permits");
  revalidatePath("/app/permits/active");
  revalidatePath(`/app/permits/${id}`);
  revalidatePath(`/app/permits/${id}/closeout`);
  revalidatePath("/field/permits");
}

export async function createPermitAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const asDraft = formData.get("asDraft") === "1" || formData.get("asDraft") === "on";
    const contractorCompanyId = String(formData.get("contractorCompanyId") || "");
    const siteId = String(formData.get("siteId") || "") || undefined;
    const organizationId = String(formData.get("organizationId") || "");
    let contractorName = String(formData.get("contractorName") || "") || undefined;
    if (contractorCompanyId) {
      const { data: company } = await supabase
        .from("contractor_companies")
        .select("id, name, organization_id")
        .eq("id", contractorCompanyId)
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (!company) return { ok: false, error: "Contractor must belong to this organization" };
      contractorName = company.name;
      const { getPtwEligibility } = await import("@/lib/services/contractors");
      const eligibility = await getPtwEligibility(supabase, {
        organizationId,
        companyId: contractorCompanyId,
        siteId,
      });
      if (eligibility.blocksPermit) {
        return {
          ok: false,
          error: `Contractor is not ready for this site: ${eligibility.readiness?.gaps.map((g) => g.message).join("; ")}`,
        };
      }
    }
    const row = await createPermit(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      permitTypeCode: String(formData.get("permitTypeCode") || ""),
      title: String(formData.get("title") || "").trim(),
      workDescription: String(formData.get("workDescription") || ""),
      siteId: String(formData.get("siteId") || "") || undefined,
      projectId: String(formData.get("projectId") || "") || undefined,
      departmentId: String(formData.get("departmentId") || "") || undefined,
      locationId: String(formData.get("locationId") || "") || undefined,
      riskAssessmentId: String(formData.get("riskAssessmentId") || "") || undefined,
      jsaId: String(formData.get("jsaId") || "") || undefined,
      jhaId: String(formData.get("jhaId") || "") || undefined,
      validFrom: String(formData.get("validFrom") || "") || undefined,
      validTo: String(formData.get("validTo") || "") || undefined,
      workLeaderId: String(formData.get("workLeaderId") || "") || undefined,
      areaOwnerId: String(formData.get("areaOwnerId") || "") || undefined,
      workOrderRef: String(formData.get("workOrderRef") || "") || undefined,
      clientReference: String(formData.get("clientReference") || "") || undefined,
      contractorName,
      workerCount: formData.get("workerCount")
        ? Number(formData.get("workerCount"))
        : undefined,
      equipment: String(formData.get("equipment") || "") || undefined,
      tools: String(formData.get("tools") || "") || undefined,
      materials: String(formData.get("materials") || "") || undefined,
      additionalControls: String(formData.get("additionalControls") || "") || undefined,
      priority: String(formData.get("priority") || "normal") || undefined,
      isolationLoto: formData.get("isolationLoto") === "on",
      asDraft,
    });
    if (!row.title || row.title.length < 2) {
      // title validated in service via DB; double-check empty
    }
    revalidatePermit(row.id);
    return { ok: true, id: row.id, href: `/app/permits/${row.id}` };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function transitionPermitAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const permitId = String(formData.get("permitId") || "");
    await transitionPermit(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      permitId,
      toStatus: String(formData.get("toStatus") || ""),
      signatureName: String(formData.get("signatureName") || "") || undefined,
      closeoutNotes: String(formData.get("closeoutNotes") || "") || undefined,
      reason: String(formData.get("reason") || "") || undefined,
    });
    revalidatePermit(permitId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function linkRiskAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const permitId = String(formData.get("permitId") || "");
    await linkRiskToPermit(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      permitId,
      riskAssessmentId: String(formData.get("riskAssessmentId") || "") || undefined,
      jsaId: String(formData.get("jsaId") || "") || undefined,
      jhaId: String(formData.get("jhaId") || "") || undefined,
    });
    revalidatePermit(permitId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function updateChecklistItemAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const permitId = String(formData.get("permitId") || "");
    await updateChecklistItem(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      itemId: String(formData.get("itemId") || ""),
      responseValue: String(formData.get("responseValue") || "") || undefined,
      isChecked: formData.get("isChecked") === "on" || formData.get("responseValue") === "yes",
      comment: String(formData.get("comment") || "") || undefined,
    });
    revalidatePermit(permitId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function decideApprovalAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const permitId = String(formData.get("permitId") || "");
    await decidePermitApproval(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      approvalId: String(formData.get("approvalId") || ""),
      decision: String(formData.get("decision") || "approved") as
        | "approved"
        | "rejected"
        | "skipped",
      comment: String(formData.get("comment") || "") || undefined,
      signatureName: String(formData.get("signatureName") || "") || undefined,
    });
    revalidatePermit(permitId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function addWorkerAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const permitId = String(formData.get("permitId") || "");
    await addPermitWorker(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      permitId,
      workerName: String(formData.get("workerName") || "") || undefined,
      roleLabel: String(formData.get("roleLabel") || "") || undefined,
      contractorCompany: String(formData.get("contractorCompany") || "") || undefined,
      isContractor: formData.get("isContractor") === "on",
    });
    revalidatePermit(permitId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function upsertIsolationAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const permitId = String(formData.get("permitId") || "");
    const isolationType = String(formData.get("isolationType") || "electrical");
    if (!ISOLATION_TYPES.includes(isolationType as (typeof ISOLATION_TYPES)[number])) {
      return { ok: false, error: "Invalid isolation type" };
    }
    await upsertIsolation(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      permitId,
      isolationId: String(formData.get("isolationId") || "") || undefined,
      isolationType: isolationType as (typeof ISOLATION_TYPES)[number],
      equipment: String(formData.get("equipment") || "") || undefined,
      energySource: String(formData.get("energySource") || "") || undefined,
      isolationPoint: String(formData.get("isolationPoint") || "") || undefined,
      method: String(formData.get("method") || "") || undefined,
      status: (String(formData.get("status") || "required") as
        | "required"
        | "applied"
        | "verified"
        | "released"),
      evidenceNotes: String(formData.get("evidenceNotes") || "") || undefined,
    });
    revalidatePermit(permitId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function requestExtensionAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const permitId = String(formData.get("permitId") || "");
    await requestExtension(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      permitId,
      newValidTo: String(formData.get("newValidTo") || ""),
      reason: String(formData.get("reason") || ""),
    });
    revalidatePermit(permitId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function decideExtensionAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const permitId = String(formData.get("permitId") || "");
    await decideExtension(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      extensionId: String(formData.get("extensionId") || ""),
      decision: String(formData.get("decision") || "approved") as "approved" | "rejected",
    });
    revalidatePermit(permitId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function suspendPermitAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const permitId = String(formData.get("permitId") || "");
    await suspendPermit(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      permitId,
      reasonCode: String(formData.get("reasonCode") || "other"),
      reason: String(formData.get("reason") || ""),
    });
    revalidatePermit(permitId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function resumePermitAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const permitId = String(formData.get("permitId") || "");
    await resumePermit(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      permitId,
    });
    revalidatePermit(permitId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function startCloseoutAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const permitId = String(formData.get("permitId") || "");
    await startCloseout(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      permitId,
      notes: String(formData.get("notes") || "") || undefined,
      workCompleted: formData.get("workCompleted") === "on",
      areaRestored: formData.get("areaRestored") === "on",
      toolsRemoved: formData.get("toolsRemoved") === "on",
      isolationsReleased: formData.get("isolationsReleased") === "on",
      personnelAccounted: formData.get("personnelAccounted") === "on",
    });
    revalidatePermit(permitId);
    return { ok: true, href: `/app/permits/${permitId}/closeout` };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function completeCloseoutAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const permitId = String(formData.get("permitId") || "");
    await completeCloseout(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      permitId,
      closeoutNotes: String(formData.get("closeoutNotes") || "") || undefined,
    });
    revalidatePermit(permitId);
    return { ok: true, href: `/app/permits/${permitId}` };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function addCommentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const permitId = String(formData.get("permitId") || "");
    await addPermitComment(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      permitId,
      body: String(formData.get("body") || ""),
    });
    revalidatePermit(permitId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function uploadPermitAttachmentsAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const permitId = String(formData.get("permitId") || "");
    const { collectFiles, uploadPermitAttachments } = await import("@/lib/services/attachments");
    const files = collectFiles(formData);
    await uploadPermitAttachments(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
      userId: user.id,
      permitId,
      files,
    });
    revalidatePermit(permitId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}
