"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import {
  createCapaForEvent,
  createEhsEvent,
  transitionEhsEvent,
  upsertInvestigation,
} from "@/lib/services/events";
import type { EhsEventStatus } from "@/types/database";

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
  description: z.string().min(20),
  siteId: z.string().uuid().optional(),
  severityId: z.string().uuid().optional(),
  occurredAt: z.string().optional(),
  immediateAction: z.string().optional(),
  equipmentAssets: z.string().optional(),
  submit: z.boolean().optional(),
});

export async function createEventAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const parsed = createSchema.safeParse({
    organizationId: formData.get("organizationId"),
    eventTypeCode: formData.get("eventTypeCode"),
    title: formData.get("title") || undefined,
    description: formData.get("description"),
    siteId: formData.get("siteId") || undefined,
    severityId: formData.get("severityId") || undefined,
    occurredAt: formData.get("occurredAt") || undefined,
    immediateAction: formData.get("immediateAction") || undefined,
    equipmentAssets: formData.get("equipmentAssets") || undefined,
    submit: formData.get("submit") === "true",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid event payload");
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
  redirect(`${path}/${result.event.id}`);
}

export async function transitionEventAction(formData: FormData): Promise<void> {
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
}

export async function saveInvestigationAction(formData: FormData): Promise<void> {
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
}

export async function createCapaAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const eventId = String(formData.get("eventId") || "");
  await createCapaForEvent(supabase, {
    organizationId: String(formData.get("organizationId") || ""),
    userId: user.id,
    eventId,
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || "") || undefined,
    dueDate: String(formData.get("dueDate") || "") || undefined,
  });
  revalidatePath(`/app/incidents/${eventId}`);
}
