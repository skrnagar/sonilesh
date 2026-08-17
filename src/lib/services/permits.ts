import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { requireFeature } from "@/lib/services/entitlements";
import { requirePermission } from "@/lib/services/rbac";
import { notifySiteSupervisors, notifyUsers } from "@/lib/services/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

/** expire_overdue_permits is service_role-only (SECURITY DEFINER, global update). */
async function expireOverduePermitsAsService() {
  try {
    const admin = createAdminClient();
    await admin.rpc("expire_overdue_permits");
  } catch {
    // Service role missing in some local setups; listing must still succeed.
  }
}

/**
 * Default PTW transitions — safe defaults until generic workflow engine lands.
 * Do not treat as immutable org policy; orgs will override via workflow later.
 */
export type PermitStatus =
  | "draft"
  | "requested"
  | "under_review"
  | "risk_review"
  | "pre_work_checklist"
  | "approval_required"
  | "approved"
  | "active"
  | "suspended"
  | "extension_pending"
  | "expired"
  | "closeout"
  | "closed"
  | "rejected"
  | "cancelled"
  // legacy aliases still accepted for reads / field compatibility
  | "risk_check"
  | "authorization";

export const PERMIT_TRANSITIONS: Record<string, string[]> = {
  draft: ["requested", "cancelled"],
  requested: ["under_review", "risk_review", "cancelled", "rejected"],
  under_review: ["risk_review", "pre_work_checklist", "cancelled", "rejected"],
  risk_review: ["pre_work_checklist", "cancelled", "rejected"],
  risk_check: ["pre_work_checklist", "cancelled", "rejected"], // legacy
  pre_work_checklist: ["approval_required", "cancelled", "rejected"],
  approval_required: ["approved", "active", "rejected", "cancelled"],
  authorization: ["approved", "active", "rejected", "cancelled"], // legacy
  approved: ["active", "cancelled"],
  active: ["extension_pending", "suspended", "closeout", "expired"],
  suspended: ["active", "closeout", "cancelled"],
  extension_pending: ["active", "closeout", "cancelled"],
  expired: ["closeout", "cancelled"],
  closeout: ["closed"],
  closed: [],
  rejected: [],
  cancelled: [],
};

export const ISOLATION_TYPES = [
  "electrical",
  "mechanical",
  "hydraulic",
  "pneumatic",
  "pressure",
  "thermal",
  "chemical",
  "other",
] as const;

export function canTransitionPermit(from: string, to: string) {
  return PERMIT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function normalizePermitStatus(status: string): PermitStatus {
  if (status === "risk_check") return "risk_review";
  if (status === "authorization") return "approval_required";
  return status as PermitStatus;
}

export function isPermitExpired(status: string, validTo: string | null | undefined) {
  if (status === "expired") return true;
  if (!validTo) return false;
  if (!["active", "extension_pending", "suspended"].includes(status)) return false;
  return new Date(validTo).getTime() < Date.now();
}

export function permitCountdown(validTo: string | null | undefined, nowMs = Date.now()) {
  if (!validTo) return null;
  const ms = new Date(validTo).getTime() - nowMs;
  return {
    ms,
    expired: ms <= 0,
    hours: Math.max(0, Math.floor(ms / (1000 * 60 * 60))),
    minutes: Math.max(0, Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))),
    label: ms <= 0
      ? "Expired"
      : `${Math.floor(ms / (1000 * 60 * 60))}h ${Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))}m`,
  };
}

export function isExpiringSoon(
  validTo: string | null | undefined,
  withinHours = 4,
  nowMs = Date.now(),
) {
  const c = permitCountdown(validTo, nowMs);
  if (!c || c.expired) return false;
  return c.ms <= withinHours * 60 * 60 * 1000;
}

export function permitValidityDisplay(
  status: string,
  validFrom: string | null | undefined,
  validTo: string | null | undefined,
  nowMs = Date.now(),
) {
  if (status === "suspended") return "Suspended";
  if (status === "closed" || status === "cancelled" || status === "rejected") {
    return status.replace(/_/g, " ");
  }
  if (isPermitExpired(status, validTo) || status === "expired") return "Expired";
  if (validFrom && new Date(validFrom).getTime() > nowMs) return "Not Started";
  if (status === "active" && isExpiringSoon(validTo, 4, nowMs)) return "Expiring Soon";
  if (status === "active") return "Active";
  return normalizePermitStatus(status).replace(/_/g, " ");
}

async function logPermitHistory(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    permitId: string;
    actorUserId: string;
    eventType: string;
    message: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    reason?: string;
  },
) {
  await supabase.from("permit_history").insert({
    organization_id: input.organizationId,
    permit_id: input.permitId,
    actor_user_id: input.actorUserId,
    event_type: input.eventType,
    message: input.message,
    old_value: input.oldValue ?? null,
    new_value: input.newValue ?? null,
    reason: input.reason ?? null,
  });
}

export async function resolvePermitType(
  supabase: SupabaseClient,
  organizationId: string,
  permitTypeCodeOrId: string,
) {
  const byId = permitTypeCodeOrId.includes("-");
  let query = supabase.from("permit_types").select("*").eq("is_active", true);
  if (byId) {
    query = query.eq("id", permitTypeCodeOrId);
  } else {
    query = query
      .eq("code", permitTypeCodeOrId)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order("organization_id", { ascending: false })
      .limit(1);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Permit type not found");
  return data;
}

/** Validate linked risk assessment / JSA / JHA against org rules — no scoring here. */
export async function validateLinkedRisk(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    riskAssessmentId?: string | null;
    jsaId?: string | null;
    jhaId?: string | null;
    siteId?: string | null;
    projectId?: string | null;
    requireRisk?: boolean;
    requireApproved?: boolean;
    matchSite?: boolean;
  },
) {
  const ids = [input.riskAssessmentId, input.jsaId, input.jhaId].filter(Boolean) as string[];
  if (input.requireRisk && !input.riskAssessmentId && !input.jsaId && !input.jhaId) {
    throw new Error("A linked Risk Assessment, JSA, or JHA is required for this permit type");
  }
  if (!ids.length) return;

  const { data: rows, error } = await supabase
    .from("risk_assessments")
    .select(
      "id, organization_id, status, site_id, project_id, assessment_number, title, residual_risk_band, deleted_at",
    )
    .in("id", ids);
  if (error) throw new Error(error.message);

  for (const id of ids) {
    const row = (rows ?? []).find((r) => r.id === id);
    if (!row || row.deleted_at) {
      throw new Error("Linked risk assessment was not found");
    }
    if (row.organization_id !== input.organizationId) {
      throw new Error("Cannot link a risk assessment from another organization");
    }
    if (row.status === "retired" || row.status === "cancelled") {
      throw new Error(`Risk assessment ${row.assessment_number} is ${row.status} and cannot be used`);
    }
    if (input.requireApproved && row.status !== "active") {
      throw new Error(
        `Risk assessment ${row.assessment_number} must be approved/active (current: ${row.status})`,
      );
    }
    if (input.matchSite && input.siteId && row.site_id && row.site_id !== input.siteId) {
      throw new Error(
        `Risk assessment ${row.assessment_number} site does not match the permit site`,
      );
    }
    if (input.matchSite && input.projectId && row.project_id && row.project_id !== input.projectId) {
      throw new Error(
        `Risk assessment ${row.assessment_number} project does not match the permit project`,
      );
    }
  }
}

export async function createPermit(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    permitTypeCode: string;
    title: string;
    workDescription?: string;
    description?: string;
    siteId?: string;
    projectId?: string;
    departmentId?: string;
    locationId?: string;
    businessUnitId?: string;
    riskAssessmentId?: string;
    jsaId?: string;
    jhaId?: string;
    validFrom?: string;
    validTo?: string;
    isolationLoto?: boolean;
    workLeaderId?: string;
    areaOwnerId?: string;
    workOrderRef?: string;
    clientReference?: string;
    contractorName?: string;
    workerCount?: number;
    equipment?: string;
    tools?: string;
    materials?: string;
    additionalControls?: string;
    priority?: string;
    customFields?: Record<string, unknown>;
    asDraft?: boolean;
  },
) {
  await requireFeature(supabase, input.organizationId, "permit_to_work");
  await requirePermission(supabase, input.organizationId, input.userId, "permits.create");

  if (!input.title?.trim() || input.title.trim().length < 2) {
    throw new Error("Work title is required");
  }

  const typeRow = await resolvePermitType(supabase, input.organizationId, input.permitTypeCode);

  for (const [label, id, table] of [
    ["Site", input.siteId, "sites"],
    ["Project", input.projectId, "projects"],
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

  const requireRisk = Boolean(typeRow.requires_risk_assessment);
  // Drafts may defer risk; submit/activate enforce fully
  if (!input.asDraft) {
    await validateLinkedRisk(supabase, {
      organizationId: input.organizationId,
      riskAssessmentId: input.riskAssessmentId,
      jsaId: input.jsaId,
      jhaId: input.jhaId,
      siteId: input.siteId,
      projectId: input.projectId,
      requireRisk,
      requireApproved: false,
      matchSite: Boolean(typeRow.match_risk_site),
    });
  }

  const prefix = (typeRow.number_prefix as string) || "PTW";
  const { data: number, error: numErr } = await supabase.rpc("next_event_number", {
    p_organization_id: input.organizationId,
    p_sequence_key: `permit:${typeRow.code}`,
    p_prefix: `${prefix}-`,
  });
  if (numErr) throw new Error(numErr.message);

  const workDescription = input.workDescription ?? input.description ?? "";
  const validFrom = input.validFrom ?? new Date().toISOString();
  const validTo =
    input.validTo ??
    new Date(
      Date.now() + (typeRow.default_validity_hours ?? 8) * 60 * 60 * 1000,
    ).toISOString();

  let residualBand: string | null = null;
  const primaryRiskId = input.riskAssessmentId ?? input.jsaId ?? input.jhaId;
  if (primaryRiskId) {
    const { data: ra } = await supabase
      .from("risk_assessments")
      .select("residual_risk_band")
      .eq("id", primaryRiskId)
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    residualBand = ra?.residual_risk_band ?? null;
  }

  const qrToken = crypto.randomUUID().replace(/-/g, "").slice(0, 12);

  const { data, error } = await supabase
    .from("permits")
    .insert({
      organization_id: input.organizationId,
      permit_type_id: typeRow.id,
      permit_number: number as string,
      title: input.title,
      work_description: workDescription,
      description: workDescription,
      site_id: input.siteId ?? null,
      project_id: input.projectId ?? null,
      department_id: input.departmentId ?? null,
      location_id: input.locationId ?? null,
      business_unit_id: input.businessUnitId ?? null,
      risk_assessment_id: input.riskAssessmentId ?? null,
      jsa_id: input.jsaId ?? null,
      jha_id: input.jhaId ?? null,
      requester_id: input.userId,
      work_leader_id: input.workLeaderId ?? null,
      area_owner_id: input.areaOwnerId ?? null,
      status: input.asDraft ? "draft" : "requested",
      valid_from: validFrom,
      valid_to: validTo,
      isolation_loto_required:
        input.isolationLoto ??
        Boolean(typeRow.requires_isolation) ??
        input.permitTypeCode === "loto",
      work_order_ref: input.workOrderRef ?? null,
      client_reference: input.clientReference ?? null,
      contractor_name: input.contractorName ?? null,
      worker_count: input.workerCount ?? null,
      equipment: input.equipment ?? null,
      tools: input.tools ?? null,
      materials: input.materials ?? null,
      additional_controls: input.additionalControls ?? null,
      priority: input.priority ?? "normal",
      custom_fields: input.customFields ?? {},
      residual_risk_band: residualBand,
      qr_token: qrToken,
      created_by: input.userId,
      submitted_at: input.asDraft ? null : new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await seedPermitChecklist(supabase, {
    organizationId: input.organizationId,
    permitId: data.id,
    permitTypeId: typeRow.id,
    purpose: "pre_work",
  });

  await applyApprovalRules(supabase, {
    organizationId: input.organizationId,
    permitId: data.id,
    permitTypeId: typeRow.id,
    siteId: input.siteId,
    residualRiskBand: residualBand,
  });

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "permit.created",
    entityType: "permit",
    entityId: data.id,
    newValues: { number: data.permit_number, type: typeRow.code, status: data.status },
  });

  await logPermitHistory(supabase, {
    organizationId: input.organizationId,
    permitId: data.id,
    actorUserId: input.userId,
    eventType: "created",
    message: `Permit ${data.permit_number} created`,
    newValue: { status: data.status },
  });

  if (!input.asDraft) {
    await notifySiteSupervisors(supabase, {
      organizationId: input.organizationId,
      siteId: input.siteId,
      title: `Permit submitted: ${data.permit_number}`,
      body: data.title,
      link: `/app/permits/${data.id}`,
      actorUserId: input.userId,
      eventKey: "permit.submitted",
    });
  }

  return data;
}

export async function seedPermitChecklist(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    permitId: string;
    permitTypeId: string;
    purpose: "pre_work" | "closeout" | "extension";
  },
) {
  // Prefer org template for type, then system template for type, then generic system
  let template: { id: string } | null = null;
  const attempts = [
    { org: input.organizationId, typeId: input.permitTypeId },
    { org: null as string | null, typeId: input.permitTypeId },
    { org: null as string | null, typeId: null as string | null },
  ];
  for (const attempt of attempts) {
    let q = supabase
      .from("permit_templates")
      .select("id")
      .eq("purpose", input.purpose)
      .eq("is_active", true)
      .limit(1);
    q = attempt.org
      ? q.eq("organization_id", attempt.org)
      : q.is("organization_id", null);
    q = attempt.typeId ? q.eq("permit_type_id", attempt.typeId) : q.is("permit_type_id", null);
    const { data } = await q.maybeSingle();
    if (data) {
      template = data;
      break;
    }
  }

  if (!template) return null;

  const { data: checklist, error } = await supabase
    .from("permit_checklists")
    .insert({
      organization_id: input.organizationId,
      permit_id: input.permitId,
      template_id: template.id,
      purpose: input.purpose,
      status: "open",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const { data: items } = await supabase
    .from("permit_checklist_templates")
    .select("*")
    .eq("template_id", template.id)
    .order("sort_order");

  if (items?.length) {
    await supabase.from("permit_checklist_items").insert(
      items.map((item, idx) => ({
        organization_id: input.organizationId,
        permit_id: input.permitId,
        checklist_id: checklist.id,
        item_text: item.prompt,
        item_key: item.item_key,
        response_type: item.response_type,
        is_required: item.is_required,
        evidence_required: item.evidence_required,
        failure_blocks_approval: item.failure_blocks_approval,
        failure_requires_comment: item.failure_requires_comment,
        sort_order: item.sort_order ?? idx,
      })),
    );
  }

  return checklist;
}

export async function applyApprovalRules(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    permitId: string;
    permitTypeId: string;
    siteId?: string | null;
    residualRiskBand?: string | null;
  },
) {
  const { data: rules } = await supabase
    .from("permit_approval_rules")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("is_active", true)
    .or(`permit_type_id.eq.${input.permitTypeId},permit_type_id.is.null`)
    .order("approval_level");
  const matched = (rules ?? []).filter((rule) => {
    if (rule.site_id && input.siteId && rule.site_id !== input.siteId) return false;
    const bands = (rule.residual_risk_bands as string[]) ?? [];
    if (bands.length && input.residualRiskBand && !bands.includes(input.residualRiskBand)) {
      return false;
    }
    if (bands.length && !input.residualRiskBand) return false;
    return true;
  });

  const defaults =
    matched.length > 0
      ? matched
      : [
          { required_role: "supervisor", approval_level: 1 },
          { required_role: "area_owner", approval_level: 2 },
          { required_role: "ehs", approval_level: 3 },
          { required_role: "issuer", approval_level: 4 },
        ];

  const { data: existing } = await supabase
    .from("permit_approvals")
    .select("id")
    .eq("permit_id", input.permitId)
    .limit(1);
  if (existing?.length) return;

  await supabase.from("permit_approvals").insert(
    defaults.map((rule) => ({
      organization_id: input.organizationId,
      permit_id: input.permitId,
      approver_role: rule.required_role,
      approval_level: rule.approval_level,
      status: "pending",
    })),
  );
}

export function evaluateChecklistGate(
  items: Array<{
    is_required?: boolean;
    is_checked?: boolean;
    response_value?: string | null;
    failure_blocks_approval?: boolean;
    is_blocking_failure?: boolean;
    failure_requires_comment?: boolean;
    comment?: string | null;
  }>,
) {
  let remaining = 0;
  let blocking = 0;
  for (const item of items) {
    const answered =
      item.is_checked ||
      (item.response_value != null && String(item.response_value).trim() !== "");
    if (item.is_required && !answered) remaining += 1;
    const failed =
      item.is_blocking_failure ||
      ["no", "fail", "failed"].includes(String(item.response_value || "").toLowerCase());
    if (item.failure_blocks_approval && failed) {
      blocking += 1;
      if (item.failure_requires_comment && !item.comment?.trim()) remaining += 1;
    }
  }
  return {
    remaining,
    blocking,
    ok: remaining === 0 && blocking === 0,
    message:
      remaining > 0
        ? `${remaining} required check${remaining === 1 ? "" : "s"} remaining.`
        : blocking > 0
          ? `${blocking} blocking checklist failure${blocking === 1 ? "" : "s"} must be resolved.`
          : null,
  };
}

export async function assertChecklistReady(
  supabase: SupabaseClient,
  organizationId: string,
  permitId: string,
  purpose: "pre_work" | "closeout" = "pre_work",
) {
  const { data: checklists } = await supabase
    .from("permit_checklists")
    .select("id")
    .eq("permit_id", permitId)
    .eq("organization_id", organizationId)
    .eq("purpose", purpose);

  if (!checklists?.length) return;

  const { data: items } = await supabase
    .from("permit_checklist_items")
    .select("*")
    .eq("permit_id", permitId)
    .eq("organization_id", organizationId)
    .in(
      "checklist_id",
      checklists.map((c) => c.id),
    );

  const gate = evaluateChecklistGate(items ?? []);
  if (!gate.ok) throw new Error(gate.message ?? "Checklist incomplete");
}

export async function updateChecklistItem(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    itemId: string;
    responseValue?: string;
    isChecked?: boolean;
    comment?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "permits.update");
  const value = input.responseValue?.toLowerCase();
  const failed = value === "no" || value === "fail" || value === "failed";
  const { data, error } = await supabase
    .from("permit_checklist_items")
    .update({
      response_value: input.responseValue ?? null,
      is_checked: input.isChecked ?? Boolean(input.responseValue),
      comment: input.comment ?? null,
      is_blocking_failure: failed,
      checked_by: input.userId,
      checked_at: new Date().toISOString(),
    })
    .eq("id", input.itemId)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await logPermitHistory(supabase, {
    organizationId: input.organizationId,
    permitId: data.permit_id,
    actorUserId: input.userId,
    eventType: "checklist_changed",
    message: `Checklist item updated: ${data.item_text}`,
    newValue: { response: input.responseValue, checked: data.is_checked },
  });
  return data;
}

export async function getPermitBundle(
  supabase: SupabaseClient,
  organizationId: string,
  permitId: string,
) {
  const { data: permit, error } = await supabase
    .from("permits")
    .select(
      `
      *,
      permit_types:permit_type_id(*),
      sites:site_id(id, name),
      projects:project_id(id, name),
      locations:location_id(id, name),
      risk_assessments:risk_assessment_id(
        id, assessment_number, title, status, residual_risk_band, inherent_risk_band, task_activity
      )
    `,
    )
    .eq("id", permitId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!permit) return null;

  const [workers, approvals, checklists, items, isolations, extensions, suspensions, closeouts, comments, history, attachmentsRes] =
    await Promise.all([
      supabase.from("permit_workers").select("*").eq("permit_id", permitId),
      supabase
        .from("permit_approvals")
        .select("*")
        .eq("permit_id", permitId)
        .order("approval_level"),
      supabase.from("permit_checklists").select("*").eq("permit_id", permitId),
      supabase
        .from("permit_checklist_items")
        .select("*")
        .eq("permit_id", permitId)
        .order("sort_order"),
      supabase.from("permit_isolations").select("*").eq("permit_id", permitId),
      supabase
        .from("permit_extensions")
        .select("*")
        .eq("permit_id", permitId)
        .order("created_at", { ascending: false }),
      supabase
        .from("permit_suspensions")
        .select("*")
        .eq("permit_id", permitId)
        .order("created_at", { ascending: false }),
      supabase.from("permit_closeouts").select("*").eq("permit_id", permitId),
      supabase
        .from("permit_comments")
        .select("*")
        .eq("permit_id", permitId)
        .order("created_at", { ascending: false }),
      supabase
        .from("permit_history")
        .select("*")
        .eq("permit_id", permitId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("permit_attachments")
        .select("id, file_name, content_type, file_size, storage_path, file_url, created_at")
        .eq("permit_id", permitId)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
    ]);

  const checklistGate = evaluateChecklistGate(items.data ?? []);

  const { createSignedAttachmentUrl } = await import("@/lib/services/attachments");
  const attachments = await Promise.all(
    (attachmentsRes.data ?? []).map(async (row) => {
      const path = row.storage_path || row.file_url;
      const mime = row.content_type || "";
      let url: string | null = null;
      if (path && !String(path).startsWith("http")) {
        try {
          url = await createSignedAttachmentUrl(supabase, path);
        } catch {
          url = null;
        }
      } else if (String(path || "").startsWith("http")) {
        url = path;
      }
      return {
        id: row.id,
        file_name: row.file_name,
        content_type: row.content_type as string | null,
        file_size: row.file_size as number | null,
        storage_path: path as string,
        kind: (mime.startsWith("image/") ? "photo" : "document") as "photo" | "document",
        created_at: row.created_at as string | undefined,
        url,
      };
    }),
  );

  return {
    permit,
    workers: workers.data ?? [],
    approvals: approvals.data ?? [],
    checklists: checklists.data ?? [],
    checklistItems: items.data ?? [],
    checklistGate,
    isolations: isolations.data ?? [],
    extensions: extensions.data ?? [],
    suspensions: suspensions.data ?? [],
    closeouts: closeouts.data ?? [],
    comments: comments.data ?? [],
    history: history.data ?? [],
    attachments,
  };
}

export async function listPermits(
  supabase: SupabaseClient,
  organizationId: string,
  opts?: {
    status?: string | string[];
    siteId?: string;
    permitTypeId?: string;
    activeBoard?: boolean;
    limit?: number;
  },
) {
  await expireOverduePermitsAsService();

  let query = supabase
    .from("permits")
    .select(
      `
      id, permit_number, title, status, valid_from, valid_to, residual_risk_band, priority,
      work_leader_id, requester_id, site_id, project_id, location_id,
      permit_types:permit_type_id(code, name),
      sites:site_id(name),
      projects:project_id(name),
      locations:location_id(name)
    `,
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("valid_to", { ascending: true, nullsFirst: false })
    .limit(opts?.limit ?? 100);

  if (opts?.activeBoard) {
    query = query.in("status", ["active", "suspended", "extension_pending", "expired"]);
  } else if (opts?.status) {
    const statuses = Array.isArray(opts.status) ? opts.status : [opts.status];
    query = query.in("status", statuses);
  }
  if (opts?.siteId) query = query.eq("site_id", opts.siteId);
  if (opts?.permitTypeId) query = query.eq("permit_type_id", opts.permitTypeId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function linkRiskToPermit(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    permitId: string;
    riskAssessmentId?: string;
    jsaId?: string;
    jhaId?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "permits.update");
  const { data: permit } = await supabase
    .from("permits")
    .select("*, permit_types:permit_type_id(*)")
    .eq("id", input.permitId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!permit) throw new Error("Permit not found");

  const typeRow = permit.permit_types as {
    requires_approved_risk?: boolean;
    match_risk_site?: boolean;
  } | null;

  await validateLinkedRisk(supabase, {
    organizationId: input.organizationId,
    riskAssessmentId: input.riskAssessmentId,
    jsaId: input.jsaId,
    jhaId: input.jhaId,
    siteId: permit.site_id,
    projectId: permit.project_id,
    requireRisk: false,
    requireApproved: Boolean(typeRow?.requires_approved_risk),
    matchSite: Boolean(typeRow?.match_risk_site),
  });

  const primary = input.riskAssessmentId ?? input.jsaId ?? input.jhaId;
  let residualBand = permit.residual_risk_band;
  if (primary) {
    const { data: ra } = await supabase
      .from("risk_assessments")
      .select("residual_risk_band")
      .eq("id", primary)
      .maybeSingle();
    residualBand = ra?.residual_risk_band ?? residualBand;
  }

  const { data, error } = await supabase
    .from("permits")
    .update({
      risk_assessment_id: input.riskAssessmentId ?? permit.risk_assessment_id,
      jsa_id: input.jsaId ?? permit.jsa_id,
      jha_id: input.jhaId ?? permit.jha_id,
      residual_risk_band: residualBand,
      updated_by: input.userId,
    })
    .eq("id", input.permitId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await logPermitHistory(supabase, {
    organizationId: input.organizationId,
    permitId: input.permitId,
    actorUserId: input.userId,
    eventType: "risk_linked",
    message: "Risk assessment linked to permit",
    newValue: {
      riskAssessmentId: input.riskAssessmentId,
      jsaId: input.jsaId,
      jhaId: input.jhaId,
    },
  });
  return data;
}

export async function transitionPermit(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    permitId: string;
    toStatus: PermitStatus | string;
    signatureName?: string;
    closeoutNotes?: string;
    reason?: string;
  },
) {
  await requireFeature(supabase, input.organizationId, "permit_to_work");

  const { data: current } = await supabase
    .from("permits")
    .select("*, permit_types:permit_type_id(*)")
    .eq("id", input.permitId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!current) throw new Error("Permit not found");

  const toStatus = normalizePermitStatus(input.toStatus);
  const from = current.status as string;

  if (
    isPermitExpired(from, current.valid_to) &&
    !["closeout", "closed", "cancelled", "expired"].includes(toStatus)
  ) {
    await supabase
      .from("permits")
      .update({ status: "expired", updated_by: input.userId })
      .eq("id", current.id);
    throw new Error("Permit has expired and cannot be used");
  }

  if (!canTransitionPermit(from, toStatus) && !canTransitionPermit(normalizePermitStatus(from), toStatus)) {
    throw new Error(`Cannot transition permit from ${from} to ${toStatus}`);
  }

  const typeRow = current.permit_types as {
    requires_risk_assessment?: boolean;
    requires_approved_risk?: boolean;
    match_risk_site?: boolean;
    prevent_self_approval?: boolean;
    requires_isolation?: boolean;
  } | null;

  // Permission matrix by target
  if (["approval_required", "approved", "active"].includes(toStatus)) {
    await requirePermission(supabase, input.organizationId, input.userId, "permits.approve");
  } else if (toStatus === "closed") {
    await requirePermission(supabase, input.organizationId, input.userId, "permits.close");
  } else if (toStatus === "suspended") {
    await requirePermission(supabase, input.organizationId, input.userId, "permits.suspend");
  } else if (toStatus === "rejected") {
    await requirePermission(supabase, input.organizationId, input.userId, "permits.reject");
  } else if (toStatus === "cancelled") {
    await requirePermission(supabase, input.organizationId, input.userId, "permits.cancel");
  } else if (toStatus === "requested") {
    await requirePermission(supabase, input.organizationId, input.userId, "permits.submit");
  } else {
    await requirePermission(supabase, input.organizationId, input.userId, "permits.update");
  }

  if (toStatus === "active") {
    if (current.valid_from && new Date(current.valid_from).getTime() > Date.now()) {
      throw new Error("Permit cannot become Active before its planned start");
    }
    if (isPermitExpired("active", current.valid_to)) {
      throw new Error("Expired permit cannot become Active");
    }
    await validateLinkedRisk(supabase, {
      organizationId: input.organizationId,
      riskAssessmentId: current.risk_assessment_id,
      jsaId: current.jsa_id,
      jhaId: current.jha_id,
      siteId: current.site_id,
      projectId: current.project_id,
      requireRisk: Boolean(typeRow?.requires_risk_assessment),
      requireApproved: Boolean(typeRow?.requires_approved_risk),
      matchSite: Boolean(typeRow?.match_risk_site),
    });
    await assertChecklistReady(supabase, input.organizationId, current.id, "pre_work");

    if (typeRow?.prevent_self_approval && current.requester_id === input.userId) {
      throw new Error("Self-approval is not allowed for this permit type");
    }

    const { data: pending } = await supabase
      .from("permit_approvals")
      .select("id, status")
      .eq("permit_id", current.id)
      .eq("status", "pending");
    if (pending?.length) {
      // Allow activation if user is completing final issuer step with signature
      if (!input.signatureName) {
        throw new Error("All required approvals must be completed before activation");
      }
    }

    if (input.signatureName) {
      await supabase.from("permit_approvals").insert({
        organization_id: input.organizationId,
        permit_id: current.id,
        approver_role: "issuer",
        approver_id: input.userId,
        approval_level: 99,
        status: "approved",
        signature_name: input.signatureName,
        signed_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
      });
    }
  }

  if (["approved", "approval_required"].includes(toStatus)) {
    await assertChecklistReady(supabase, input.organizationId, current.id, "pre_work");
  }

  const patch: Record<string, unknown> = {
    status: toStatus,
    updated_by: input.userId,
  };
  if (toStatus === "requested") patch.submitted_at = new Date().toISOString();
  if (toStatus === "active") {
    patch.issuer_id = input.userId;
    patch.permit_issuer_id = input.userId;
    patch.activated_at = new Date().toISOString();
  }
  if (toStatus === "suspended") {
    patch.suspended_at = new Date().toISOString();
    patch.suspended_by = input.userId;
    patch.suspension_reason = input.reason ?? null;
  }
  if (toStatus === "active" && from === "suspended") {
    patch.suspended_at = null;
    patch.suspension_reason = null;
  }
  if (toStatus === "closed") {
    patch.closed_at = new Date().toISOString();
    patch.closed_by = input.userId;
    patch.closeout_notes = input.closeoutNotes ?? null;
  }

  const { data, error } = await supabase
    .from("permits")
    .update(patch)
    .eq("id", input.permitId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "permit.status_changed",
    entityType: "permit",
    entityId: input.permitId,
    previousValues: { status: from },
    newValues: { status: toStatus },
  });

  await logPermitHistory(supabase, {
    organizationId: input.organizationId,
    permitId: input.permitId,
    actorUserId: input.userId,
    eventType: "status_change",
    message: `Status ${from} → ${toStatus}`,
    oldValue: { status: from },
    newValue: { status: toStatus },
    reason: input.reason,
  });

  const link = `/app/permits/${input.permitId}`;
  if (toStatus === "approval_required") {
    await notifySiteSupervisors(supabase, {
      organizationId: input.organizationId,
      siteId: current.site_id,
      title: `Approval required: ${current.permit_number}`,
      body: current.title,
      link,
      actorUserId: input.userId,
      eventKey: "permit.approval_required",
    });
  }
  if (toStatus === "approved" || toStatus === "active") {
    if (current.requester_id) {
      await notifyUsers(supabase, {
        organizationId: input.organizationId,
        userIds: [current.requester_id],
        title: `Permit ${toStatus}: ${current.permit_number}`,
        body: current.title,
        link,
        actorUserId: input.userId,
        eventKey: `permit.${toStatus}`,
      });
    }
  }
  if (toStatus === "rejected") {
    if (current.requester_id) {
      await notifyUsers(supabase, {
        organizationId: input.organizationId,
        userIds: [current.requester_id],
        title: `Permit rejected: ${current.permit_number}`,
        body: input.reason ?? current.title,
        link,
        actorUserId: input.userId,
        eventKey: "permit.rejected",
      });
    }
  }

  return data;
}

export async function decidePermitApproval(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    approvalId: string;
    decision: "approved" | "rejected" | "skipped";
    comment?: string;
    signatureName?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "permits.approve");

  const { data: approval } = await supabase
    .from("permit_approvals")
    .select("*, permits:permit_id(id, requester_id, permit_number, status, permit_types:permit_type_id(prevent_self_approval))")
    .eq("id", input.approvalId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!approval) throw new Error("Approval step not found");
  if (approval.status !== "pending") throw new Error("Approval already decided");

  const permit = approval.permits as {
    id: string;
    requester_id?: string;
    permit_number?: string;
    permit_types?: { prevent_self_approval?: boolean } | null;
  } | null;

  if (
    permit?.permit_types?.prevent_self_approval &&
    permit.requester_id === input.userId &&
    input.decision === "approved"
  ) {
    throw new Error("Self-approval is not allowed for this permit type");
  }

  const patch: Record<string, unknown> = {
    status: input.decision,
    approver_id: input.userId,
    comments: input.comment ?? null,
    signature_name: input.signatureName ?? null,
    signed_at: new Date().toISOString(),
  };
  if (input.decision === "approved") patch.approved_at = new Date().toISOString();
  if (input.decision === "rejected") patch.rejected_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("permit_approvals")
    .update(patch)
    .eq("id", input.approvalId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await logPermitHistory(supabase, {
    organizationId: input.organizationId,
    permitId: data.permit_id,
    actorUserId: input.userId,
    eventType: input.decision === "approved" ? "approved" : "rejected",
    message: `Approval ${approval.approver_role}: ${input.decision}`,
    reason: input.comment,
  });

  if (input.decision === "rejected" && permit?.id) {
    await transitionPermit(supabase, {
      organizationId: input.organizationId,
      userId: input.userId,
      permitId: permit.id,
      toStatus: "rejected",
      reason: input.comment,
    });
  }

  return data;
}

export async function addPermitWorker(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    permitId: string;
    memberUserId?: string;
    workerName?: string;
    roleLabel?: string;
    contractorCompany?: string;
    isContractor?: boolean;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "permits.assign");

  if (input.memberUserId) {
    const { data: member } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", input.organizationId)
      .eq("user_id", input.memberUserId)
      .eq("status", "active")
      .maybeSingle();
    if (!member) throw new Error("Worker must be an active organization member");
  }

  const { data, error } = await supabase
    .from("permit_workers")
    .insert({
      organization_id: input.organizationId,
      permit_id: input.permitId,
      user_id: input.memberUserId ?? null,
      worker_name: input.workerName ?? null,
      role_label: input.roleLabel ?? "worker",
      contractor_company: input.contractorCompany ?? null,
      is_contractor: input.isContractor ?? false,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function upsertIsolation(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    permitId: string;
    isolationId?: string;
    isolationType: (typeof ISOLATION_TYPES)[number];
    equipment?: string;
    energySource?: string;
    isolationPoint?: string;
    method?: string;
    status?: "required" | "applied" | "verified" | "released";
    evidenceNotes?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "permits.update");

  const status = input.status ?? "required";
  const payload: Record<string, unknown> = {
    organization_id: input.organizationId,
    permit_id: input.permitId,
    isolation_type: input.isolationType,
    equipment: input.equipment ?? null,
    energy_source: input.energySource ?? null,
    isolation_point: input.isolationPoint ?? null,
    method: input.method ?? null,
    status,
    evidence_notes: input.evidenceNotes ?? null,
  };
  if (status === "applied") {
    payload.applied_by = input.userId;
    payload.applied_at = new Date().toISOString();
  }
  if (status === "verified") {
    payload.verified_by = input.userId;
    payload.verified_at = new Date().toISOString();
  }
  if (status === "released") {
    payload.released_by = input.userId;
    payload.released_at = new Date().toISOString();
  }

  const { data, error } = input.isolationId
    ? await supabase
        .from("permit_isolations")
        .update(payload)
        .eq("id", input.isolationId)
        .eq("organization_id", input.organizationId)
        .select("*")
        .single()
    : await supabase.from("permit_isolations").insert(payload).select("*").single();
  if (error) throw new Error(error.message);

  await logPermitHistory(supabase, {
    organizationId: input.organizationId,
    permitId: input.permitId,
    actorUserId: input.userId,
    eventType: "isolation_updated",
    message: `Isolation ${status}: ${input.isolationType}`,
  });
  return data;
}

export async function requestExtension(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    permitId: string;
    newValidTo: string;
    reason: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "permits.extend");
  const { data: permit } = await supabase
    .from("permits")
    .select("*")
    .eq("id", input.permitId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!permit) throw new Error("Permit not found");
  if (permit.status !== "active") throw new Error("Only active permits can be extended");
  if (new Date(input.newValidTo).getTime() <= new Date(permit.valid_to).getTime()) {
    throw new Error("New expiry must be after current expiry");
  }

  const { data: ext, error } = await supabase
    .from("permit_extensions")
    .insert({
      organization_id: input.organizationId,
      permit_id: input.permitId,
      previous_valid_to: permit.valid_to,
      new_valid_to: input.newValidTo,
      reason: input.reason,
      requested_by: input.userId,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await transitionPermit(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    permitId: input.permitId,
    toStatus: "extension_pending",
    reason: input.reason,
  });

  await notifySiteSupervisors(supabase, {
    organizationId: input.organizationId,
    siteId: permit.site_id,
    title: `Extension requested: ${permit.permit_number}`,
    body: input.reason,
    link: `/app/permits/${permit.id}`,
    actorUserId: input.userId,
    eventKey: "permit.extension_requested",
  });

  return ext;
}

export async function decideExtension(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    extensionId: string;
    decision: "approved" | "rejected";
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "permits.approve");
  const { data: ext } = await supabase
    .from("permit_extensions")
    .select("*")
    .eq("id", input.extensionId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!ext) throw new Error("Extension not found");
  if (ext.status !== "pending") throw new Error("Extension already decided");

  const patch: Record<string, unknown> = {
    status: input.decision,
    approved_by: input.userId,
  };
  if (input.decision === "approved") patch.approved_at = new Date().toISOString();
  else patch.rejected_at = new Date().toISOString();

  const { error } = await supabase
    .from("permit_extensions")
    .update(patch)
    .eq("id", input.extensionId);
  if (error) throw new Error(error.message);

  // Never overwrite history: previous_valid_to stays on extension row
  if (input.decision === "approved") {
    await supabase
      .from("permits")
      .update({ valid_to: ext.new_valid_to, status: "active", updated_by: input.userId })
      .eq("id", ext.permit_id)
      .eq("organization_id", input.organizationId);
  } else {
    await supabase
      .from("permits")
      .update({ status: "active", updated_by: input.userId })
      .eq("id", ext.permit_id)
      .eq("organization_id", input.organizationId);
  }

  await logPermitHistory(supabase, {
    organizationId: input.organizationId,
    permitId: ext.permit_id,
    actorUserId: input.userId,
    eventType: "extended",
    message: `Extension ${input.decision}`,
    oldValue: { valid_to: ext.previous_valid_to },
    newValue: { valid_to: ext.new_valid_to, decision: input.decision },
  });

  return ext;
}

export async function suspendPermit(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    permitId: string;
    reasonCode: string;
    reason: string;
  },
) {
  await transitionPermit(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    permitId: input.permitId,
    toStatus: "suspended",
    reason: input.reason,
  });

  const { data, error } = await supabase
    .from("permit_suspensions")
    .insert({
      organization_id: input.organizationId,
      permit_id: input.permitId,
      reason_code: input.reasonCode,
      reason: input.reason,
      suspended_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function resumePermit(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; permitId: string },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "permits.resume");
  const { data: open } = await supabase
    .from("permit_suspensions")
    .select("id")
    .eq("permit_id", input.permitId)
    .is("resumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (open) {
    await supabase
      .from("permit_suspensions")
      .update({ resumed_at: new Date().toISOString(), resumed_by: input.userId })
      .eq("id", open.id);
  }
  return transitionPermit(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    permitId: input.permitId,
    toStatus: "active",
  });
}

export async function startCloseout(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    permitId: string;
    notes?: string;
    workCompleted?: boolean;
    areaRestored?: boolean;
    toolsRemoved?: boolean;
    isolationsReleased?: boolean;
    personnelAccounted?: boolean;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "permits.close");
  const { data: permit } = await supabase
    .from("permits")
    .select("*, permit_types:permit_type_id(*)")
    .eq("id", input.permitId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!permit) throw new Error("Permit not found");

  if (!["active", "suspended", "expired", "extension_pending", "closeout"].includes(permit.status)) {
    throw new Error("Permit is not eligible for close-out");
  }

  if (permit.status !== "closeout") {
    await transitionPermit(supabase, {
      organizationId: input.organizationId,
      userId: input.userId,
      permitId: input.permitId,
      toStatus: "closeout",
    });
  }

  const typeRow = permit.permit_types as { id?: string; requires_closeout_checklist?: boolean } | null;
  let checklistId: string | null = null;
  if (typeRow?.requires_closeout_checklist !== false) {
    const existing = await supabase
      .from("permit_checklists")
      .select("id")
      .eq("permit_id", input.permitId)
      .eq("purpose", "closeout")
      .maybeSingle();
    if (!existing.data && typeRow?.id) {
      const seeded = await seedPermitChecklist(supabase, {
        organizationId: input.organizationId,
        permitId: input.permitId,
        permitTypeId: typeRow.id,
        purpose: "closeout",
      });
      checklistId = seeded?.id ?? null;
    } else {
      checklistId = existing.data?.id ?? null;
    }
  }

  const { data: closeout, error } = await supabase
    .from("permit_closeouts")
    .insert({
      organization_id: input.organizationId,
      permit_id: input.permitId,
      owner_id: input.userId,
      notes: input.notes ?? null,
      work_completed: input.workCompleted ?? false,
      area_restored: input.areaRestored ?? false,
      tools_removed: input.toolsRemoved ?? false,
      isolations_released: input.isolationsReleased ?? false,
      personnel_accounted: input.personnelAccounted ?? false,
      checklist_id: checklistId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await logPermitHistory(supabase, {
    organizationId: input.organizationId,
    permitId: input.permitId,
    actorUserId: input.userId,
    eventType: "closeout_started",
    message: "Close-out started",
  });

  return closeout;
}

export async function completeCloseout(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    permitId: string;
    closeoutNotes?: string;
  },
) {
  await assertChecklistReady(supabase, input.organizationId, input.permitId, "closeout");
  await supabase
    .from("permit_closeouts")
    .update({ closed_at: new Date().toISOString() })
    .eq("permit_id", input.permitId)
    .eq("organization_id", input.organizationId)
    .is("closed_at", null);

  return transitionPermit(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    permitId: input.permitId,
    toStatus: "closed",
    closeoutNotes: input.closeoutNotes,
  });
}

export async function addPermitComment(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; permitId: string; body: string },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "permits.view");
  const { data, error } = await supabase
    .from("permit_comments")
    .insert({
      organization_id: input.organizationId,
      permit_id: input.permitId,
      author_id: input.userId,
      body: input.body,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listExpiringPermits(
  supabase: SupabaseClient,
  organizationId: string,
  withinHours = 24,
) {
  await expireOverduePermitsAsService();
  const until = new Date(Date.now() + withinHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("permits")
    .select("*, permit_types:permit_type_id(code, name)")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .lte("valid_to", until)
    .is("deleted_at", null)
    .order("valid_to", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function requestPermitRenewal(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; permitId: string },
) {
  await requireFeature(supabase, input.organizationId, "permit_to_work");

  const { data: current, error } = await supabase
    .from("permits")
    .select("*")
    .eq("id", input.permitId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!current) throw new Error("Permit not found");

  const { data: typeRow } = await supabase
    .from("permit_types")
    .select("code, number_prefix")
    .eq("id", current.permit_type_id)
    .maybeSingle();

  const prefix = typeRow?.number_prefix || "PTW";
  const { data: number, error: numErr } = await supabase.rpc("next_event_number", {
    p_organization_id: input.organizationId,
    p_sequence_key: `permit:${typeRow?.code ?? "general"}`,
    p_prefix: `${prefix}-`,
  });
  const permitNumber =
    !numErr && number
      ? String(number)
      : `${current.permit_number}-R${Date.now().toString(36).slice(-4)}`;

  const { data, error: insertError } = await supabase
    .from("permits")
    .insert({
      organization_id: input.organizationId,
      permit_type_id: current.permit_type_id,
      permit_number: permitNumber,
      title: `${current.title} (renewal)`,
      work_description: current.work_description,
      description: current.work_description,
      site_id: current.site_id,
      project_id: current.project_id,
      department_id: current.department_id,
      location_id: current.location_id,
      risk_assessment_id: current.risk_assessment_id,
      jsa_id: current.jsa_id,
      jha_id: current.jha_id,
      requester_id: input.userId,
      status: "requested",
      valid_from: new Date().toISOString(),
      valid_to: current.valid_to,
      isolation_loto_required: current.isolation_loto_required,
      residual_risk_band: current.residual_risk_band,
      created_by: input.userId,
      parent_permit_id: current.id,
      qr_token: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
      submitted_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (insertError) throw new Error(insertError.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "permit.renewal_requested",
    entityType: "permit",
    entityId: data.id,
    previousValues: { from: current.id },
  });

  await logPermitHistory(supabase, {
    organizationId: input.organizationId,
    permitId: data.id,
    actorUserId: input.userId,
    eventType: "created",
    message: `Renewal of ${current.permit_number}`,
  });

  return data;
}

export async function getPermitMetrics(
  supabase: SupabaseClient,
  organizationId: string,
) {
  await expireOverduePermitsAsService();
  const { data } = await supabase
    .from("permits")
    .select("id, status, valid_to, closed_at, residual_risk_band, permit_type_id, site_id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .limit(500);

  const rows = data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  return {
    active: rows.filter((p) => p.status === "active").length,
    pendingApprovals: rows.filter((p) =>
      ["approval_required", "authorization", "approved"].includes(p.status),
    ).length,
    expiringSoon: rows.filter(
      (p) => p.status === "active" && isExpiringSoon(p.valid_to, 4),
    ).length,
    expired: rows.filter((p) => p.status === "expired").length,
    suspended: rows.filter((p) => p.status === "suspended").length,
    closedToday: rows.filter(
      (p) => p.status === "closed" && p.closed_at?.startsWith(today),
    ).length,
  };
}
