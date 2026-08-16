"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import {
  createCapaForEvent,
  createEhsEvent,
  transitionEhsEvent,
  upsertInvestigation,
} from "@/lib/services/events";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
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
    "unsafe_act",
    "unsafe_condition",
    "hazard",
  ]),
  title: z.string().optional(),
  description: z.string().trim().min(8, "Description must be at least 8 characters"),
  siteId: z.string().uuid().optional(),
  severityId: z.string().uuid().optional(),
  occurredAt: z.string().optional(),
  immediateAction: z.string().optional(),
  equipmentAssets: z.string().optional(),
  submit: z.boolean().optional(),
});

export async function createEventAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const intent = String(formData.get("intent") || formData.get("submit") || "");
    const parsed = createSchema.safeParse({
      organizationId: formData.get("organizationId"),
      eventTypeCode: formData.get("eventTypeCode"),
      title: String(formData.get("title") || "").trim() || undefined,
      description: formData.get("description"),
      siteId: String(formData.get("siteId") || "") || undefined,
      severityId: String(formData.get("severityId") || "") || undefined,
      occurredAt: parseOccurredAt(String(formData.get("occurredAt") || "") || undefined),
      immediateAction: String(formData.get("immediateAction") || "") || undefined,
      equipmentAssets: String(formData.get("equipmentAssets") || "") || undefined,
      submit: intent === "true" || intent === "submit",
    });

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid event payload" };
    }

    const result = await createEhsEvent(supabase, {
      ...parsed.data,
      userId: user.id,
    });

    const path =
      parsed.data.eventTypeCode === "incident"
        ? "/app/incidents"
        : parsed.data.eventTypeCode === "near_miss"
          ? "/app/near-misses"
          : "/app/hazards";

    revalidatePath(path);
    revalidatePath("/field");
    return { ok: true, id: result.event.id, href: `${path}/${result.event.id}` };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function transitionEventAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const organizationId = String(formData.get("organizationId") || "");
    const eventId = String(formData.get("eventId") || "");
    const toStatus = String(formData.get("toStatus") || "") as EhsEventStatus;
    const note = String(formData.get("note") || "") || undefined;
    const acceptNoActionRequired = formData.get("acceptNoActionRequired") === "true";

    await transitionEhsEvent(supabase, {
      organizationId,
      userId: user.id,
      eventId,
      toStatus,
      note,
      acceptNoActionRequired,
      noActionReason: note,
    });

    revalidatePath(`/app/incidents/${eventId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function saveInvestigationAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const eventId = String(formData.get("eventId") || "");
    await upsertInvestigation(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
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
    const { supabase, user } = await requireUser();
    const eventId = String(formData.get("eventId") || "");
    const title = String(formData.get("title") || "").trim();
    if (!title) return { ok: false, error: "CAPA title is required" };
    await createCapaForEvent(supabase, {
      organizationId: String(formData.get("organizationId") || ""),
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
