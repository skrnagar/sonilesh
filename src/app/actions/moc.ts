"use server";

import { revalidatePath } from "next/cache";
import { requireModuleAccess, requireWriteAccess } from "@/lib/auth/org-context";
import {
  addMocAction,
  addMocImpact,
  createMocRequest,
  decideMocApproval,
  implementMoc,
  linkMocDocument,
  linkMocRisk,
  transitionMoc,
  verifyMoc,
  type MocStatus,
} from "@/lib/services/moc";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/events";

function failed(err: unknown): ActionResult {
  return { ok: false, error: formatSupabaseUserError(err) };
}

function revalidateMoc(id: string) {
  revalidatePath("/app/moc");
  revalidatePath(`/app/moc/${id}`);
}

export async function createMocAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user, organization, supabase } = await requireWriteAccess({
      featureCode: "moc",
      permission: "moc.manage",
    });
    const title = String(formData.get("title") || "").trim();
    if (!title) return { ok: false, error: "Title is required" };
    const row = await createMocRequest(supabase, {
      organizationId: organization.id,
      userId: user.id,
      title,
      description: String(formData.get("description") || "") || undefined,
      siteId: String(formData.get("siteId") || "") || undefined,
      changeType: String(formData.get("changeType") || "") || undefined,
      currentState: String(formData.get("currentState") || "") || undefined,
      proposedState: String(formData.get("proposedState") || "") || undefined,
      impactSummary: String(formData.get("impactSummary") || "") || undefined,
      riskAssessmentId: String(formData.get("riskAssessmentId") || "") || undefined,
      trainingRequired: formData.get("trainingRequired") === "on",
      trainingCourseId: String(formData.get("trainingCourseId") || "") || undefined,
    });
    revalidateMoc(row.id);
    return { ok: true, id: row.id, href: `/app/moc/${row.id}` };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function transitionMocAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({ featureCode: "moc" });
    if (!access.entitled) throw new Error("This module is not enabled for your plan.");
    const { user, organization, supabase } = access;
    const mocId = String(formData.get("mocId") || "");
    await transitionMoc(supabase, {
      organizationId: organization.id,
      userId: user.id,
      mocId,
      toStatus: String(formData.get("toStatus") || "") as MocStatus,
      message: String(formData.get("message") || "") || undefined,
    });
    revalidateMoc(mocId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function linkMocRiskAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user, organization, supabase } = await requireWriteAccess({
      featureCode: "moc",
      permission: "moc.manage",
    });
    const mocId = String(formData.get("mocId") || "");
    await linkMocRisk(supabase, {
      organizationId: organization.id,
      userId: user.id,
      mocId,
      riskAssessmentId: String(formData.get("riskAssessmentId") || ""),
    });
    revalidateMoc(mocId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function addMocImpactAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user, organization, supabase } = await requireWriteAccess({
      featureCode: "moc",
      permission: "moc.manage",
    });
    const mocId = String(formData.get("mocId") || "");
    await addMocImpact(supabase, {
      organizationId: organization.id,
      userId: user.id,
      mocId,
      area: String(formData.get("area") || ""),
      description: String(formData.get("description") || "") || undefined,
      severity: (String(formData.get("severity") || "medium") as "low" | "medium" | "high" | "critical"),
    });
    revalidateMoc(mocId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function decideMocApprovalAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user, organization, supabase } = await requireWriteAccess({
      featureCode: "moc",
      permission: "moc.approve",
    });
    const mocId = String(formData.get("mocId") || "");
    await decideMocApproval(supabase, {
      organizationId: organization.id,
      userId: user.id,
      mocId,
      decision: formData.get("decision") === "rejected" ? "rejected" : "approved",
      comments: String(formData.get("comments") || "") || undefined,
    });
    revalidateMoc(mocId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function addMocCapaAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user, organization, supabase } = await requireWriteAccess({
      featureCode: "moc",
      permission: "moc.manage",
    });
    const mocId = String(formData.get("mocId") || "");
    await addMocAction(supabase, {
      organizationId: organization.id,
      userId: user.id,
      mocId,
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || "") || undefined,
      dueDate: String(formData.get("dueDate") || "") || undefined,
    });
    revalidateMoc(mocId);
    revalidatePath("/app/capa");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function linkMocDocumentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user, organization, supabase } = await requireWriteAccess({
      featureCode: "moc",
      permission: "moc.manage",
    });
    const mocId = String(formData.get("mocId") || "");
    await linkMocDocument(supabase, {
      organizationId: organization.id,
      userId: user.id,
      mocId,
      documentId: String(formData.get("documentId") || ""),
    });
    revalidateMoc(mocId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function implementMocAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user, organization, supabase } = await requireWriteAccess({
      featureCode: "moc",
      permission: "moc.implement",
    });
    const mocId = String(formData.get("mocId") || "");
    await implementMoc(supabase, {
      organizationId: organization.id,
      userId: user.id,
      mocId,
      notes: String(formData.get("notes") || "") || undefined,
    });
    revalidateMoc(mocId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function verifyMocAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user, organization, supabase } = await requireWriteAccess({
      featureCode: "moc",
      permission: "moc.verify",
    });
    const mocId = String(formData.get("mocId") || "");
    await verifyMoc(supabase, {
      organizationId: organization.id,
      userId: user.id,
      mocId,
      notes: String(formData.get("notes") || "") || undefined,
    });
    revalidateMoc(mocId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}
