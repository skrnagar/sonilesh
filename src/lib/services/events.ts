import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { requireFeature } from "@/lib/services/entitlements";
import { requirePermission } from "@/lib/services/rbac";
import { assertSourceClosable } from "@/lib/services/capa";
import type { EhsEventStatus } from "@/types/database";

const TRANSITIONS: Record<EhsEventStatus, EhsEventStatus[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["triage", "cancelled"],
  triage: ["investigation", "capa", "verification", "cancelled"],
  investigation: ["capa", "verification"],
  capa: ["verification"],
  verification: ["approval", "capa"],
  approval: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["triage", "investigation", "capa"],
  cancelled: [],
};

const FEATURE_BY_TYPE: Record<string, string> = {
  incident: "incident_management",
  near_miss: "near_miss",
  unsafe_act: "hazard_reporting",
  unsafe_condition: "hazard_reporting",
  hazard: "hazard_reporting",
};

const PERMISSION_CREATE: Record<string, string> = {
  incident: "incidents.create",
  near_miss: "near_miss.create",
  unsafe_act: "hazards.create",
  unsafe_condition: "hazards.create",
  hazard: "hazards.create",
};

export function canTransition(from: EhsEventStatus, to: EhsEventStatus) {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

function toIsoTimestamp(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

async function getEventType(
  supabase: SupabaseClient,
  eventTypeId: string,
) {
  const { data, error } = await supabase
    .from("event_types")
    .select("*")
    .eq("id", eventTypeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Event type not found");
  return data;
}

export async function findPossibleDuplicates(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    siteId?: string | null;
    eventTypeId: string;
    occurredAt: string;
  },
) {
  const occurred = new Date(input.occurredAt);
  const from = new Date(occurred.getTime() - 6 * 60 * 60 * 1000).toISOString();
  const to = new Date(occurred.getTime() + 6 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("ehs_events")
    .select("id, event_number, title, status, occurred_at, site_id")
    .eq("organization_id", input.organizationId)
    .eq("event_type_id", input.eventTypeId)
    .gte("occurred_at", from)
    .lte("occurred_at", to)
    .is("deleted_at", null)
    .limit(5);

  if (input.siteId) query = query.eq("site_id", input.siteId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createEhsEvent(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    eventTypeCode: string;
    description: string;
    title?: string;
    siteId?: string;
    projectId?: string;
    departmentId?: string;
    locationId?: string;
    severityId?: string;
    occurredAt?: string;
    immediateAction?: string;
    equipmentAssets?: string;
    isAnonymous?: boolean;
    submit?: boolean;
  },
) {
  const feature = FEATURE_BY_TYPE[input.eventTypeCode];
  const permission = PERMISSION_CREATE[input.eventTypeCode];
  if (!feature || !permission) throw new Error("Unsupported event type");

  await requireFeature(supabase, input.organizationId, feature);
  await requirePermission(supabase, input.organizationId, input.userId, permission);

  let { data: eventType, error: eventTypeError } = await supabase
    .from("event_types")
    .select("id, code")
    .eq("code", input.eventTypeCode)
    .is("organization_id", null)
    .maybeSingle();
  if (eventTypeError) throw new Error(eventTypeError.message);
  if (!eventType) {
    const fallback = await supabase
      .from("event_types")
      .select("id, code")
      .eq("code", input.eventTypeCode)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (fallback.error) throw new Error(fallback.error.message);
    eventType = fallback.data;
  }
  if (!eventType) {
    throw new Error(
      `Event type "${input.eventTypeCode}" is not seeded. Apply supabase migrations, then retry.`,
    );
  }

  let investigationRequired = false;
  if (input.severityId) {
    const { data: severity } = await supabase
      .from("severity_levels")
      .select("requires_investigation")
      .eq("id", input.severityId)
      .maybeSingle();
    investigationRequired = Boolean(severity?.requires_investigation);
  }

  const prefixMap: Record<string, string> = {
    incident: "INC-",
    near_miss: "NM-",
    unsafe_act: "UA-",
    unsafe_condition: "UC-",
    hazard: "HZ-",
  };

  const { data: numberData, error: numberError } = await supabase.rpc(
    "next_event_number",
    {
      p_organization_id: input.organizationId,
      p_sequence_key: input.eventTypeCode,
      p_prefix: prefixMap[input.eventTypeCode] ?? "EVT-",
    },
  );
  if (numberError) throw new Error(`Numbering RPC failed: ${numberError.message}`);
  if (!numberData) throw new Error("Numbering RPC returned no event number");

  const occurredAt = toIsoTimestamp(input.occurredAt) ?? new Date().toISOString();
  const status: EhsEventStatus = input.submit ? "submitted" : "draft";
  const duplicates = await findPossibleDuplicates(supabase, {
    organizationId: input.organizationId,
    siteId: input.siteId,
    eventTypeId: eventType.id,
    occurredAt,
  });

  const { data, error } = await supabase
    .from("ehs_events")
    .insert({
      organization_id: input.organizationId,
      event_type_id: eventType.id,
      event_number: numberData as string,
      site_id: input.siteId ?? null,
      project_id: input.projectId ?? null,
      department_id: input.departmentId ?? null,
      location_id: input.locationId ?? null,
      severity_id: input.severityId ?? null,
      status,
      title: input.title ?? null,
      description: input.description,
      occurred_at: occurredAt,
      reported_at: input.submit ? new Date().toISOString() : null,
      reporter_id: input.isAnonymous ? null : input.userId,
      is_anonymous: Boolean(input.isAnonymous),
      immediate_action: input.immediateAction ?? null,
      equipment_assets: input.equipmentAssets ?? null,
      investigation_required: investigationRequired,
      created_by: input.userId,
      updated_by: input.userId,
      metadata: {
        possible_duplicates: duplicates.map((d) => d.id),
      },
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const { error: activityError } = await supabase.from("ehs_event_activity").insert({
    organization_id: input.organizationId,
    event_id: data.id,
    actor_user_id: input.userId,
    activity_type: "created",
    message: `Event ${data.event_number} created as ${status}`,
  });
  if (activityError) {
    console.error("[ehs_event] activity insert failed", activityError.message);
  }

  try {
    await writeAuditLog(supabase, {
      organizationId: input.organizationId,
      actorUserId: input.userId,
      action: "ehs_event.created",
      entityType: "ehs_event",
      entityId: data.id,
      newValues: data,
    });
  } catch (auditError) {
    console.error(
      "[ehs_event] audit log failed",
      auditError instanceof Error ? auditError.message : auditError,
    );
  }

  return { event: data, possibleDuplicates: duplicates };
}

export async function transitionEhsEvent(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    eventId: string;
    toStatus: EhsEventStatus;
    note?: string;
    acceptNoActionRequired?: boolean;
    noActionReason?: string;
  },
) {
  const { data: event, error } = await supabase
    .from("ehs_events")
    .select("*, event_types:event_type_id(code, feature_code)")
    .eq("id", input.eventId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!event) throw new Error("Event not found");

  const fromStatus = event.status as EhsEventStatus;
  if (!canTransition(fromStatus, input.toStatus)) {
    throw new Error(`Invalid transition ${fromStatus} → ${input.toStatus}`);
  }

  const typeCode = (event.event_types as { code?: string } | null)?.code ?? "incident";
  const feature =
    (event.event_types as { feature_code?: string } | null)?.feature_code ??
    FEATURE_BY_TYPE[typeCode];
  if (feature) await requireFeature(supabase, input.organizationId, feature);

  if (input.toStatus === "closed") {
    await requirePermission(
      supabase,
      input.organizationId,
      input.userId,
      "incidents.approve",
    );

    const { data: openCapas } = await supabase
      .from("capa_items")
      .select("id, title, status, is_required")
      .eq("event_id", input.eventId)
      .eq("is_required", true)
      .is("deleted_at", null)
      .not("status", "in", '("closed","cancelled","verified")');

    const unresolved = openCapas ?? [];
    if (unresolved.length > 0) {
      if (!input.acceptNoActionRequired) {
        throw new Error(
          "Incident cannot be closed while required CAPA items remain unresolved. An authorized EHS manager must accept No Action Required.",
        );
      }
      await requirePermission(
        supabase,
        input.organizationId,
        input.userId,
        "incidents.approve",
      );
    }

    // BR-001 extended: also block on source_module/source_record_id CAPA links
    if (!input.acceptNoActionRequired) {
      try {
        await assertSourceClosable(
          supabase,
          input.organizationId,
          typeCode === "near_miss" ? "near_miss" : typeCode === "hazard" ? "hazard" : "incident",
          input.eventId,
        );
      } catch (err) {
        if (!input.acceptNoActionRequired) throw err;
      }
    }
  }

  const patch: Record<string, unknown> = {
    status: input.toStatus,
    updated_by: input.userId,
  };

  if (input.toStatus === "closed") {
    patch.closed_at = new Date().toISOString();
    patch.closed_by = input.userId;
    patch.closure_notes = input.note ?? null;
    if (input.acceptNoActionRequired) {
      patch.no_action_required = true;
      patch.no_action_accepted_by = input.userId;
      patch.no_action_accepted_at = new Date().toISOString();
      patch.no_action_reason = input.noActionReason ?? input.note ?? null;
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("ehs_events")
    .update(patch)
    .eq("id", input.eventId)
    .select("*")
    .single();
  if (updateError) throw new Error(updateError.message);

  await supabase.from("ehs_event_activity").insert({
    organization_id: input.organizationId,
    event_id: input.eventId,
    actor_user_id: input.userId,
    activity_type: "status_change",
    message: `Status changed from ${fromStatus} to ${input.toStatus}`,
    metadata: { from: fromStatus, to: input.toStatus, note: input.note ?? null },
  });

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "ehs_event.status_changed",
    entityType: "ehs_event",
    entityId: input.eventId,
    previousValues: { status: fromStatus },
    newValues: { status: input.toStatus },
    reason: input.note,
  });

  return updated;
}

export async function upsertInvestigation(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    eventId: string;
    method?: string;
    rootCause?: string;
    narrative?: string;
    contributingFactors?: unknown[];
    status?: string;
  },
) {
  await requirePermission(
    supabase,
    input.organizationId,
    input.userId,
    "incidents.investigate",
  );

  const payload = {
    organization_id: input.organizationId,
    event_id: input.eventId,
    method: input.method ?? null,
    root_cause: input.rootCause ?? null,
    narrative: input.narrative ?? null,
    contributing_factors: input.contributingFactors ?? [],
    status: input.status ?? "in_progress",
    started_at: new Date().toISOString(),
    updated_by: input.userId,
    created_by: input.userId,
  };

  const { data, error } = await supabase
    .from("investigations")
    .upsert(payload, { onConflict: "event_id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase
    .from("ehs_events")
    .update({ status: "investigation", investigator_id: input.userId, updated_by: input.userId })
    .eq("id", input.eventId)
    .eq("organization_id", input.organizationId);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "investigation.upserted",
    entityType: "investigation",
    entityId: data.id,
    newValues: data,
  });

  return data;
}

export async function createCapaForEvent(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    eventId: string;
    title: string;
    description?: string;
    dueDate?: string;
    ownerId?: string;
    priority?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "capa.create");
  await requireFeature(supabase, input.organizationId, "capa");

  const { data, error } = await supabase
    .from("capa_items")
    .insert({
      organization_id: input.organizationId,
      source_module: "ehs_event",
      source_record_id: input.eventId,
      event_id: input.eventId,
      title: input.title,
      description: input.description ?? null,
      due_date: input.dueDate ?? null,
      owner_id: input.ownerId ?? null,
      priority: input.priority ?? "medium",
      created_by: input.userId,
      updated_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase
    .from("ehs_events")
    .update({ status: "capa", updated_by: input.userId })
    .eq("id", input.eventId);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "capa.created",
    entityType: "capa_item",
    entityId: data.id,
    newValues: data,
  });

  return data;
}

export { getEventType };
