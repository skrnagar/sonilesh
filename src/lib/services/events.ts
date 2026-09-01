import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { requireFeature } from "@/lib/services/entitlements";
import { requirePermission } from "@/lib/services/rbac";
import { notifySiteSupervisors, notifyUsers } from "@/lib/services/notifications";
import { assertSourceClosable } from "@/lib/services/capa";
import { startWorkflow } from "@/lib/services/workflow";
import { saveCustomFieldValues } from "@/lib/services/attachments";
import {
  REPORT_TYPE_META,
  type ReportTypeCode,
  capaSourceModuleForType,
} from "@/lib/reporting/types";
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

const FEATURE_BY_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(REPORT_TYPE_META).map(([code, meta]) => [code, meta.featureCode]),
);

const PERMISSION_CREATE: Record<string, string> = Object.fromEntries(
  Object.entries(REPORT_TYPE_META).map(([code, meta]) => [code, meta.permissionCreate]),
);

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

async function allocateEventNumber(
  supabase: SupabaseClient,
  organizationId: string,
  sequenceKey: string,
  prefix: string,
) {
  const { data, error } = await supabase.rpc("next_event_number", {
    p_organization_id: organizationId,
    p_sequence_key: sequenceKey,
    p_prefix: prefix,
  });
  if (!error && data) return String(data);

  const { count, error: countError } = await supabase
    .from("ehs_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("deleted_at", null);
  if (countError) {
    throw new Error(
      error?.message
        ? `Numbering RPC failed (${error.message}). Fallback count also failed: ${countError.message}`
        : countError.message,
    );
  }
  const next = (count ?? 0) + 1;
  const year = new Date().getUTCFullYear();
  return `${prefix}${year}-${String(next).padStart(5, "0")}`;
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
    businessUnitId?: string;
    severityId?: string;
    potentialSeverityId?: string;
    categoryId?: string;
    occurredAt?: string;
    immediateAction?: string;
    equipmentAssets?: string;
    isAnonymous?: boolean;
    submit?: boolean;
    requiresCapa?: boolean;
    latitude?: number | null;
    longitude?: number | null;
    source?: "web" | "field" | "api" | "import" | "email";
    observationPolarity?: "positive" | "negative" | "neutral" | null;
    peopleInvolved?: string;
    recommendedControl?: string;
    existingControl?: string;
    customFieldValues?: Array<{
      fieldDefinitionId: string;
      valueText?: string | null;
      valueNumber?: number | null;
      valueBoolean?: boolean | null;
      valueDate?: string | null;
      valueJson?: unknown;
    }>;
  },
) {
  const typeMeta = REPORT_TYPE_META[input.eventTypeCode as ReportTypeCode];
  const feature = FEATURE_BY_TYPE[input.eventTypeCode] ?? typeMeta?.featureCode;
  const permission = PERMISSION_CREATE[input.eventTypeCode] ?? typeMeta?.permissionCreate;
  if (!feature || !permission) throw new Error("Unsupported event type");

  await requireFeature(supabase, input.organizationId, feature);
  await requirePermission(supabase, input.organizationId, input.userId, permission);

  for (const [label, id, table] of [
    ["Site", input.siteId, "sites"],
    ["Project", input.projectId, "projects"],
    ["Department", input.departmentId, "departments"],
    ["Location", input.locationId, "locations"],
  ] as const) {
    if (!id) continue;
    const { data: ref } = await supabase
      .from(table)
      .select("id")
      .eq("id", id)
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!ref) throw new Error(`${label} must belong to this organization`);
  }

  const eventTypeResult = await supabase
    .from("event_types")
    .select("id, code")
    .eq("code", input.eventTypeCode)
    .is("organization_id", null)
    .maybeSingle();
  let eventType = eventTypeResult.data;
  const eventTypeError = eventTypeResult.error;
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

  const prefix = typeMeta?.prefix ?? "EVT-";
  const occurredAt = toIsoTimestamp(input.occurredAt) ?? new Date().toISOString();
  const status: EhsEventStatus = input.submit ? "submitted" : "draft";

  const [numberData, duplicates, severity] = await Promise.all([
    allocateEventNumber(
      supabase,
      input.organizationId,
      input.eventTypeCode,
      prefix,
    ),
    findPossibleDuplicates(supabase, {
      organizationId: input.organizationId,
      siteId: input.siteId,
      eventTypeId: eventType.id,
      occurredAt,
    }),
    input.severityId
      ? supabase
          .from("severity_levels")
          .select("requires_investigation")
          .eq("id", input.severityId)
          .maybeSingle()
          .then((res) => res.data)
      : Promise.resolve(null),
  ]);

  const investigationRequired = Boolean(severity?.requires_investigation);

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
      business_unit_id: input.businessUnitId ?? null,
      event_category_id: input.categoryId ?? null,
      severity_id: input.severityId ?? null,
      potential_severity_id: input.potentialSeverityId ?? null,
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
      requires_capa: Boolean(input.requiresCapa) || investigationRequired,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      source: input.source ?? "web",
      observation_polarity: input.observationPolarity ?? null,
      created_by: input.userId,
      updated_by: input.userId,
      metadata: {
        possible_duplicates: duplicates.map((d) => d.id),
        recommended_control: input.recommendedControl ?? null,
        existing_control: input.existingControl ?? null,
        people_involved: input.peopleInvolved ?? null,
      },
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  if (input.peopleInvolved) {
    await supabase.from("ehs_event_people").insert({
      organization_id: input.organizationId,
      event_id: data.id,
      person_name: input.peopleInvolved.slice(0, 200),
      person_role: "involved",
    });
  }

  if (input.customFieldValues?.length) {
    await saveCustomFieldValues(supabase, {
      organizationId: input.organizationId,
      eventId: data.id,
      values: input.customFieldValues,
    });
  }

  await startWorkflow(supabase, {
    organizationId: input.organizationId,
    reportId: data.id,
    userId: input.userId,
    currentStatus: status,
    initialStatus: status,
  }).catch(() => undefined);

  const detailPath = `${typeMeta?.listPath ?? "/app/hazards"}/${data.id}`;

  await Promise.all([
    supabase
      .from("ehs_event_activity")
      .insert({
        organization_id: input.organizationId,
        event_id: data.id,
        actor_user_id: input.userId,
        activity_type: "created",
        message: `Report ${data.event_number} created as ${status}`,
      })
      .then(({ error: activityError }) => {
        if (activityError) console.error("[ehs_event] activity insert failed", activityError.message);
      }),
    writeAuditLog(supabase, {
      organizationId: input.organizationId,
      actorUserId: input.userId,
      action: "ehs_event.created",
      entityType: "ehs_event",
      entityId: data.id,
      newValues: { id: data.id, event_number: data.event_number, status, type: input.eventTypeCode },
    }).catch((auditError) => {
      console.error(
        "[ehs_event] audit log failed",
        auditError instanceof Error ? auditError.message : auditError,
      );
    }),
    notifySiteSupervisors(supabase, {
      organizationId: input.organizationId,
      siteId: input.siteId,
      actorUserId: input.userId,
      eventKey: "ehs_event.created",
      title: `New ${typeMeta?.label ?? input.eventTypeCode} ${input.submit ? "submitted" : "drafted"}`,
      body: data.event_number,
      link: detailPath,
    }).catch((notifyError) => {
      console.error("[ehs_event] notify failed", notifyError);
    }),
  ]);

  return { event: data, possibleDuplicates: duplicates };
}

export async function assignReport(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    eventId: string;
    assigneeId: string;
    note?: string;
  },
) {
  const { data: event } = await supabase
    .from("ehs_events")
    .select("id, event_number, assigned_to, event_types:event_type_id(code)")
    .eq("id", input.eventId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!event) throw new Error("Report not found");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.assigneeId)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();
  if (!membership) throw new Error("Assignee must be an active organization member");

  const { data, error } = await supabase
    .from("ehs_events")
    .update({ assigned_to: input.assigneeId, updated_by: input.userId })
    .eq("id", input.eventId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("ehs_event_activity").insert({
    organization_id: input.organizationId,
    event_id: input.eventId,
    actor_user_id: input.userId,
    activity_type: "assigned",
    message: "Report assigned",
    metadata: { assignee_id: input.assigneeId, note: input.note ?? null },
  });

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "report.assigned",
    entityType: "ehs_event",
    entityId: input.eventId,
    previousValues: { assigned_to: event.assigned_to },
    newValues: { assigned_to: input.assigneeId },
  });

  const typeCode = (event.event_types as { code?: string } | null)?.code;
  const assignMeta = REPORT_TYPE_META[typeCode as ReportTypeCode];
  await notifyUsers(supabase, {
    organizationId: input.organizationId,
    userIds: [input.assigneeId],
    actorUserId: input.userId,
    eventKey: "ehs_event.assigned",
    title: `Report assigned: ${event.event_number}`,
    body: input.note ?? "You have been assigned an EHS report",
    link: `${assignMeta?.listPath ?? "/app/incidents"}/${input.eventId}`,
  }).catch(() => undefined);

  return data;
}

export async function addReportComment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    eventId: string;
    body: string;
  },
) {
  const body = input.body.trim();
  if (!body) throw new Error("Comment body required");
  const { data: event } = await supabase
    .from("ehs_events")
    .select("id")
    .eq("id", input.eventId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!event) throw new Error("Report not found");

  const { data, error } = await supabase
    .from("ehs_event_comments")
    .insert({
      organization_id: input.organizationId,
      event_id: input.eventId,
      author_id: input.userId,
      body,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("ehs_event_activity").insert({
    organization_id: input.organizationId,
    event_id: input.eventId,
    actor_user_id: input.userId,
    activity_type: "comment_added",
    message: "Comment added",
  });

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "report.comment_added",
    entityType: "ehs_event_comment",
    entityId: data.id,
  });

  return data;
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
    forceClose?: boolean;
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

  if (fromStatus === "investigation" && ["capa", "verification", "approval", "closed"].includes(input.toStatus)) {
    const { count } = await supabase
      .from("capa_items")
      .select("id", { count: "exact", head: true })
      .eq("event_id", input.eventId)
      .is("deleted_at", null);
    if (!count) {
      throw new Error(
        "At least one linked CAPA item is required before leaving Investigation In Progress.",
      );
    }
  }

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
      if (input.forceClose) {
        await requirePermission(
          supabase,
          input.organizationId,
          input.userId,
          "incidents.approve",
        );
        if (!input.note) {
          throw new Error("Force-close requires a justification comment.");
        }
      } else if (!input.acceptNoActionRequired) {
        throw new Error(
          "Incident cannot be closed while required CAPA items remain unresolved. An authorized EHS manager must accept No Action Required or force-close with justification.",
        );
      } else {
        await requirePermission(
          supabase,
          input.organizationId,
          input.userId,
          "incidents.approve",
        );
      }
    }

    // BR-001 extended: also block on source_module/source_record_id CAPA links
    if (!input.acceptNoActionRequired) {
      try {
        await assertSourceClosable(
          supabase,
          input.organizationId,
          capaSourceModuleForType(typeCode),
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
    if (input.forceClose) {
      patch.force_closed = true;
      patch.force_close_reason = input.note ?? null;
      patch.force_closed_by = input.userId;
      patch.force_closed_at = new Date().toISOString();
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

const UAUC_TYPES = new Set(["unsafe_act", "unsafe_condition"]);

function isUaucType(code: string | undefined) {
  return code ? UAUC_TYPES.has(code) : false;
}

export async function allocateUaucEvent(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    eventId: string;
    assigneeId: string;
    note?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "hazards.allocate");
  const assigned = await assignReport(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    eventId: input.eventId,
    assigneeId: input.assigneeId,
    note: input.note,
  });
  const { data, error } = await supabase
    .from("ehs_events")
    .update({
      status: "triage",
      uauc_stage: "allocated",
      allocated_at: new Date().toISOString(),
      allocated_by: input.userId,
      updated_by: input.userId,
    })
    .eq("id", input.eventId)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await supabase.from("ehs_event_activity").insert({
    organization_id: input.organizationId,
    event_id: input.eventId,
    actor_user_id: input.userId,
    activity_type: "uauc_allocated",
    message: "UA/UC allocated to assignee",
    metadata: { assignee_id: input.assigneeId, note: input.note ?? null },
  });
  return data ?? assigned;
}

export async function assigneeCloseUaucEvent(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    eventId: string;
    note?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "hazards.close_assigned");
  const { data: event } = await supabase
    .from("ehs_events")
    .select("id, assigned_to, event_types:event_type_id(code)")
    .eq("id", input.eventId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!event) throw new Error("Event not found");
  const typeCode = (event.event_types as { code?: string } | null)?.code;
  if (!isUaucType(typeCode)) throw new Error("Not a UA/UC event");
  if (event.assigned_to && event.assigned_to !== input.userId) {
    await requirePermission(supabase, input.organizationId, input.userId, "hazards.allocate");
  }
  const { data, error } = await supabase
    .from("ehs_events")
    .update({
      status: "approval",
      uauc_stage: "assignee_closed",
      assignee_closed_at: new Date().toISOString(),
      updated_by: input.userId,
    })
    .eq("id", input.eventId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await supabase.from("ehs_event_activity").insert({
    organization_id: input.organizationId,
    event_id: input.eventId,
    actor_user_id: input.userId,
    activity_type: "uauc_assignee_closed",
    message: input.note ?? "Assignee closed after corrective action",
  });
  return data;
}

export async function finalCloseUaucEvent(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    eventId: string;
    note?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "hazards.final_close");
  const { data: event } = await supabase
    .from("ehs_events")
    .select("id, status, event_types:event_type_id(code)")
    .eq("id", input.eventId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!event) throw new Error("Event not found");
  const typeCode = (event.event_types as { code?: string } | null)?.code;
  if (!isUaucType(typeCode)) throw new Error("Not a UA/UC event");
  if (!canTransition(event.status as EhsEventStatus, "closed")) {
    throw new Error(`Cannot final-close from status ${event.status}`);
  }
  const { data, error } = await supabase
    .from("ehs_events")
    .update({
      status: "closed",
      uauc_stage: "final_closed",
      final_closed_at: new Date().toISOString(),
      closed_at: new Date().toISOString(),
      closed_by: input.userId,
      closure_notes: input.note ?? null,
      updated_by: input.userId,
    })
    .eq("id", input.eventId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "uauc.final_closed",
    entityType: "ehs_event",
    entityId: input.eventId,
    reason: input.note,
  });
  return data;
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

export { createCAPAFromReport, createCapaForEvent } from "@/lib/services/capa-bridge";
export { getEventType, capaSourceModuleForType };
