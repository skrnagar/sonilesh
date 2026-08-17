"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { requireOrgContext } from "@/lib/auth/org-context";
import {
  acknowledgeDocument,
  addDocumentVersion,
  createControlledDocument,
  decideDocumentVersion,
  distributeDocument,
  linkDocument,
  publishDocumentVersion,
  scheduleDocumentReview,
  submitDocumentVersion,
} from "@/lib/services/documents";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/events";
import { collectFiles } from "@/lib/services/attachments";

function failed(err: unknown): ActionResult {
  return { ok: false, error: formatSupabaseUserError(err) };
}

function tagsFrom(formData: FormData) {
  return String(formData.get("tags") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createDocumentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const title = String(formData.get("title") || "").trim();
    if (!title) return { ok: false, error: "Title is required" };
    const row = await createControlledDocument(supabase, {
      organizationId: organization.id,
      userId: user.id,
      title,
      docNumber: String(formData.get("docNumber") || "") || undefined,
      documentTypeId: String(formData.get("documentTypeId") || "") || undefined,
      classificationId: String(formData.get("classificationId") || "") || undefined,
      tags: tagsFrom(formData),
      expiresOn: String(formData.get("expiresOn") || "") || undefined,
      reviewDueOn: String(formData.get("reviewDueOn") || "") || undefined,
      acknowledgementRequired: formData.get("acknowledgementRequired") === "on",
      notes: String(formData.get("notes") || "") || undefined,
    });
    revalidatePath("/app/documents");
    return { ok: true, id: row.id, href: `/app/documents/${row.id}` };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function addDocumentVersionAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const documentId = String(formData.get("documentId") || "");
    const files = collectFiles(formData);
    await addDocumentVersion(supabase, {
      organizationId: organization.id,
      userId: user.id,
      documentId,
      version: String(formData.get("version") || "") || undefined,
      changeSummary: String(formData.get("changeSummary") || "") || undefined,
      file: files[0],
    });
    revalidatePath(`/app/documents/${documentId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function submitDocumentVersionAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const versionId = String(formData.get("versionId") || "");
    const documentId = String(formData.get("documentId") || "");
    await submitDocumentVersion(supabase, {
      organizationId: organization.id,
      userId: user.id,
      versionId,
    });
    revalidatePath(`/app/documents/${documentId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function decideDocumentVersionAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const documentId = String(formData.get("documentId") || "");
    await decideDocumentVersion(supabase, {
      organizationId: organization.id,
      userId: user.id,
      versionId: String(formData.get("versionId") || ""),
      decision: formData.get("decision") === "rejected" ? "rejected" : "approved",
      comments: String(formData.get("comments") || "") || undefined,
    });
    revalidatePath(`/app/documents/${documentId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function publishDocumentVersionAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const documentId = String(formData.get("documentId") || "");
    await publishDocumentVersion(supabase, {
      organizationId: organization.id,
      userId: user.id,
      versionId: String(formData.get("versionId") || ""),
    });
    revalidatePath(`/app/documents/${documentId}`);
    revalidatePath("/app/documents");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function acknowledgeDocumentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const documentId = String(formData.get("documentId") || "");
    await acknowledgeDocument(supabase, {
      organizationId: organization.id,
      userId: user.id,
      documentId,
      versionId: String(formData.get("versionId") || "") || undefined,
    });
    revalidatePath(`/app/documents/${documentId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function distributeDocumentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const documentId = String(formData.get("documentId") || "");
    await distributeDocument(supabase, {
      organizationId: organization.id,
      userId: user.id,
      documentId,
      audienceType: (String(formData.get("audienceType") || "org") as "org" | "role" | "site" | "user"),
      audienceKey: String(formData.get("audienceKey") || "all"),
    });
    revalidatePath(`/app/documents/${documentId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function scheduleDocumentReviewAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const documentId = String(formData.get("documentId") || "");
    const dueOn = String(formData.get("dueOn") || "");
    if (!dueOn) return { ok: false, error: "Review due date is required" };
    await scheduleDocumentReview(supabase, {
      organizationId: organization.id,
      userId: user.id,
      documentId,
      dueOn,
    });
    revalidatePath(`/app/documents/${documentId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function linkDocumentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const documentId = String(formData.get("documentId") || "");
    await linkDocument(supabase, {
      organizationId: organization.id,
      userId: user.id,
      documentId,
      sourceType: String(formData.get("sourceType") || ""),
      sourceId: String(formData.get("sourceId") || ""),
    });
    revalidatePath(`/app/documents/${documentId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}
