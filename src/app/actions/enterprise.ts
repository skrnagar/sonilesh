"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/auth/org-context";
import {
  allocateUaucEvent,
  assigneeCloseUaucEvent,
  beginUaucActionProgress,
  finalCloseUaucEvent,
} from "@/lib/services/events";
import { createLmraAssessment, reviewLmraAssessment } from "@/lib/services/lmra";
import { createMisSubmission, reviewMisSubmission } from "@/lib/services/mis";
import { createSiteVisit, transitionSiteVisit } from "@/lib/services/site-visits";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/events";

export async function allocateUaucAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireWriteAccess({ permission: "hazards.allocate" });
    await allocateUaucEvent(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      eventId: String(formData.get("eventId") || ""),
      assigneeId: String(formData.get("assigneeId") || ""),
      note: String(formData.get("note") || "") || undefined,
    });
    revalidatePath("/app/observations");
    revalidatePath("/app/incidents");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function beginUaucActionAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireWriteAccess({ permission: "hazards.close_assigned" });
    const eventId = String(formData.get("eventId") || "");
    await beginUaucActionProgress(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      eventId,
      note: String(formData.get("note") || "") || undefined,
    });
    revalidatePath(`/app/incidents/${eventId}`);
    revalidatePath("/app/observations");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function assigneeCloseUaucAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireWriteAccess({ permission: "hazards.close_assigned" });
    const eventId = String(formData.get("eventId") || "");
    await assigneeCloseUaucEvent(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      eventId,
      note: String(formData.get("note") || "") || undefined,
    });
    revalidatePath(`/app/incidents/${eventId}`);
    revalidatePath("/app/observations");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function finalCloseUaucAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireWriteAccess({ permission: "hazards.final_close" });
    const eventId = String(formData.get("eventId") || "");
    await finalCloseUaucEvent(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      eventId,
      note: String(formData.get("note") || "") || undefined,
    });
    revalidatePath(`/app/incidents/${eventId}`);
    revalidatePath("/app/observations");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function createLmraAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireWriteAccess({ permission: "lmra.create" });
    const row = await createLmraAssessment(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      activityDescription: String(formData.get("activityDescription") || ""),
      siteId: String(formData.get("siteId") || "") || null,
      projectId: String(formData.get("projectId") || "") || null,
      immediateAction: String(formData.get("immediateAction") || "") || undefined,
      risks: [{ text: String(formData.get("risks") || "") }],
      controls: [{ text: String(formData.get("controls") || "") }],
      submit: formData.get("submit") === "true",
    });
    revalidatePath("/app/lmra");
    return { ok: true, id: row.id, href: `/app/lmra/${row.id}` };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function reviewLmraAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireWriteAccess({ permission: "lmra.approve" });
    const assessmentId = String(formData.get("assessmentId") || "");
    const decision = String(formData.get("decision") || "") as "approved" | "rejected";
    await reviewLmraAssessment(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      assessmentId,
      decision,
      reviewNotes: String(formData.get("reviewNotes") || "") || undefined,
    });
    revalidatePath("/app/lmra");
    revalidatePath(`/app/lmra/${assessmentId}`);
    revalidatePath("/field/lmra");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function createSiteVisitAction(formData: FormData): Promise<ActionResult> {
  try {
    const visitType = String(formData.get("visitType") || "tsv") as "hsv" | "rsv" | "tsv";
    const permission =
      visitType === "hsv"
        ? "visits.hsv.create"
        : visitType === "rsv"
          ? "visits.rsv.create"
          : "visits.tsv.create";
    const access = await requireWriteAccess({ permission });
    const row = await createSiteVisit(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      visitType,
      summary: String(formData.get("summary") || ""),
      siteId: String(formData.get("siteId") || "") || null,
      projectId: String(formData.get("projectId") || "") || null,
      regionId: String(formData.get("regionId") || "") || null,
      businessUnitId: String(formData.get("businessUnitId") || "") || null,
      submit: formData.get("submit") === "true",
    });
    revalidatePath("/app/site-visits");
    return { ok: true, id: row.id, href: `/app/site-visits/${row.id}` };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function transitionSiteVisitAction(formData: FormData): Promise<ActionResult> {
  try {
    const toStatus = String(formData.get("toStatus") || "") as
      | "submitted"
      | "allocated"
      | "closed"
      | "final_closed"
      | "cancelled";
    const permission =
      toStatus === "final_closed"
        ? "visits.final_close"
        : toStatus === "allocated" || toStatus === "closed"
          ? "visits.allocate"
          : "visits.view";
    const access = await requireWriteAccess({ permission });
    const visitId = String(formData.get("visitId") || "");
    await transitionSiteVisit(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      visitId,
      toStatus,
      assignedTo: String(formData.get("assignedTo") || "") || null,
      note: String(formData.get("note") || "") || undefined,
    });
    revalidatePath("/app/site-visits");
    revalidatePath(`/app/site-visits/${visitId}`);
    return { ok: true, href: `/app/site-visits/${visitId}` };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function createMisAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireWriteAccess({ permission: "mis.create" });
    const row = await createMisSubmission(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      periodId: String(formData.get("periodId") || ""),
      summary: String(formData.get("summary") || ""),
      businessUnitId: String(formData.get("businessUnitId") || "") || null,
      regionId: String(formData.get("regionId") || "") || null,
      siteId: String(formData.get("siteId") || "") || null,
      projectId: String(formData.get("projectId") || "") || null,
      submit: formData.get("submit") === "true",
    });
    revalidatePath("/app/mis");
    return { ok: true, id: row.id };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function reviewMisAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireWriteAccess({ permission: "mis.approve" });
    const submissionId = String(formData.get("submissionId") || "");
    const decision = String(formData.get("decision") || "") as "approved" | "rejected";
    await reviewMisSubmission(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      submissionId,
      decision,
      reviewNotes: String(formData.get("reviewNotes") || "") || undefined,
    });
    revalidatePath("/app/mis");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}
