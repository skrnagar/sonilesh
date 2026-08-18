"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrgContext } from "@/lib/auth/org-context";
import {
  addReportComment,
  assignReport,
  createCapaForEvent,
  createEhsEvent,
  transitionEhsEvent,
  upsertInvestigation,
} from "@/lib/services/events";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import { REPORT_TYPE_META } from "@/lib/reporting/types";
import type { EhsEventStatus } from "@/types/database";

export type ActionResult =
  | { ok: true; href?: string; id?: string }
  | { ok: false; error: string };

function failed(err: unknown): ActionResult {
  return { ok: false, error: formatSupabaseUserError(err) };
}

function parseOccurredAt(raw?: string) {
  if (!raw) return undefined;
  const value = raw.length === 16 ? `${raw}:00` : raw;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

const createSchema = z.object({
  organizationId: z.string().uuid(),
  eventTypeCode: z.enum([
    "incident",
    "near_miss",
    "hazard",
    "unsafe_act",
    "unsafe_condition",
    "safety_observation",
  ]),
  title: z.string().optional(),
  description: z.string().trim().min(8, "Description must be at least 8 characters"),
  siteId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  severityId: z.string().uuid().optional(),
  potentialSeverityId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  occurredAt: z.string().optional(),
  immediateAction: z.string().optional(),
  equipmentAssets: z.string().optional(),
  peopleInvolved: z.string().optional(),
  recommendedControl: z.string().optional(),
  existingControl: z.string().optional(),
  observationPolarity: z.enum(["positive", "negative", "neutral"]).optional(),
  requiresCapa: z.boolean().optional(),
  isAnonymous: z.boolean().optional(),
  submit: z.boolean().optional(),
});

export async function createEventAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const intent = String(formData.get("intent") || formData.get("submit") || "");
    const parsed = createSchema.safeParse({
      organizationId: organization.id,
      eventTypeCode: formData.get("eventTypeCode"),
      title: String(formData.get("title") || "").trim() || undefined,
      description: formData.get("description"),
      siteId: String(formData.get("siteId") || "") || undefined,
      projectId: String(formData.get("projectId") || "") || undefined,
      departmentId: String(formData.get("departmentId") || "") || undefined,
      locationId: String(formData.get("locationId") || "") || undefined,
      severityId: String(formData.get("severityId") || "") || undefined,
      potentialSeverityId: String(formData.get("potentialSeverityId") || "") || undefined,
      categoryId: String(formData.get("categoryId") || "") || undefined,
      occurredAt: parseOccurredAt(String(formData.get("occurredAt") || "") || undefined),
      immediateAction: String(formData.get("immediateAction") || "") || undefined,
      equipmentAssets: String(formData.get("equipmentAssets") || "") || undefined,
      peopleInvolved: String(formData.get("peopleInvolved") || "") || undefined,
      recommendedControl: String(formData.get("recommendedControl") || "") || undefined,
      existingControl: String(formData.get("existingControl") || "") || undefined,
      observationPolarity:
        (String(formData.get("observationPolarity") || "") as
          | "positive"
          | "negative"
          | "neutral"
          | "") || undefined,
      requiresCapa: formData.get("requiresCapa") === "on",
      isAnonymous: formData.get("isAnonymous") === "on",
      submit: intent === "true" || intent === "submit",
    });

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid event payload" };
    }

    const customFieldValues: Array<{
      fieldDefinitionId: string;
      valueText?: string | null;
      valueNumber?: number | null;
      valueBoolean?: boolean | null;
      valueDate?: string | null;
    }> = [];
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("cf_") || key.startsWith("cf_id_")) continue;
      const code = key.slice(3);
      const defId = String(formData.get(`cf_id_${code}`) || "");
      if (!defId) continue;
      const raw = String(value);
      customFieldValues.push({
        fieldDefinitionId: defId,
        valueText: raw || null,
        valueBoolean: formData.get(key) === "on" ? true : undefined,
      });
    }

    const result = await createEhsEvent(supabase, {
      ...parsed.data,
      userId: user.id,
      customFieldValues,
      observationPolarity: parsed.data.observationPolarity || null,
    });

    const meta = REPORT_TYPE_META[parsed.data.eventTypeCode];
    const path = meta.listPath;

    revalidatePath(path);
    revalidatePath("/app/dashboard");
    revalidatePath("/app/reports/new");
    revalidatePath("/field");
    return { ok: true, id: result.event.id, href: `${path}/${result.event.id}` };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function transitionEventAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const organizationId = organization.id;
    const eventId = String(formData.get("eventId") || "");
    const toStatus = String(formData.get("toStatus") || "") as EhsEventStatus;
    const note = String(formData.get("note") || "") || undefined;
    const acceptNoActionRequired = formData.get("acceptNoActionRequired") === "true";
    const forceClose = formData.get("forceClose") === "true";

    await transitionEhsEvent(supabase, {
      organizationId,
      userId: user.id,
      eventId,
      toStatus,
      note,
      acceptNoActionRequired,
      noActionReason: note,
      forceClose,
    });

    revalidatePath(`/app/incidents/${eventId}`);
    revalidatePath(`/app/near-misses/${eventId}`);
    revalidatePath(`/app/hazards/${eventId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function saveInvestigationAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const eventId = String(formData.get("eventId") || "");
    await upsertInvestigation(supabase, {
      organizationId: organization.id,
      userId: user.id,
      eventId,
      method: String(formData.get("method") || "") || undefined,
      rootCause: String(formData.get("rootCause") || "") || undefined,
      narrative: String(formData.get("narrative") || "") || undefined,
      status: "in_progress",
    });
    revalidatePath(`/app/incidents/${eventId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function createCapaAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const eventId = String(formData.get("eventId") || "");
    const title = String(formData.get("title") || "").trim();
    if (!title) return { ok: false, error: "CAPA title is required" };
    await createCapaForEvent(supabase, {
      organizationId: organization.id,
      userId: user.id,
      eventId,
      title,
      description: String(formData.get("description") || "") || undefined,
      dueDate: String(formData.get("dueDate") || "") || undefined,
    });
    revalidatePath(`/app/incidents/${eventId}`);
    revalidatePath("/app/capa");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function assignReportAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    await assignReport(supabase, {
      organizationId: organization.id,
      userId: user.id,
      eventId: String(formData.get("eventId") || ""),
      assigneeId: String(formData.get("assigneeId") || ""),
      note: String(formData.get("note") || "") || undefined,
    });
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function addCommentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const eventId = String(formData.get("eventId") || "");
    await addReportComment(supabase, {
      organizationId: organization.id,
      userId: user.id,
      eventId,
      body: String(formData.get("body") || ""),
    });
    revalidatePath(`/app/incidents/${eventId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function uploadAttachmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const eventId = String(formData.get("eventId") || "");
    const { recordUploadedReportAttachment } = await import("@/lib/services/attachments");
    const paths = formData.getAll("storage_path").map(String).filter(Boolean);
    const names = formData.getAll("file_name").map(String);
    const mimes = formData.getAll("mime_type").map(String);
    const sizes = formData.getAll("file_size").map(String);
    if (!paths.length) {
      return { ok: false, error: "Select at least one file" };
    }
    if (paths.length > 12) {
      return { ok: false, error: "Maximum 12 files per upload" };
    }
    for (let i = 0; i < paths.length; i += 1) {
      await recordUploadedReportAttachment(supabase, {
        organizationId: organization.id,
        userId: user.id,
        eventId,
        storagePath: paths[i],
        fileName: names[i] || "upload.bin",
        mimeType: mimes[i] || "application/octet-stream",
        fileSize: Number(sizes[i] || 0) || 1,
      });
    }
    revalidatePath(`/app/incidents/${eventId}`);
    revalidatePath(`/app/near-misses/${eventId}`);
    revalidatePath(`/app/hazards/${eventId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}
