import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { createCapa } from "@/lib/services/capa";
import { linkDocument, listLinkedDocuments } from "@/lib/services/documents";
import { requireFeature } from "@/lib/services/entitlements";
import { notifyUsers } from "@/lib/services/notifications";
import { requirePermission } from "@/lib/services/rbac";
import { assignTraining } from "@/lib/services/supporting";

export const MOC_STATUSES = [
  "requested",
  "risk_review",
  "approval",
  "implementation",
  "post_change_verification",
  "closed",
  "cancelled",
] as const;

export type MocStatus = (typeof MOC_STATUSES)[number];

export const MOC_TRANSITIONS: Record<MocStatus, MocStatus[]> = {
  requested: ["risk_review", "cancelled"],
  risk_review: ["approval", "requested", "cancelled"],
  approval: ["implementation", "risk_review", "cancelled"],
  implementation: ["post_change_verification", "cancelled"],
  post_change_verification: ["closed", "implementation"],
  closed: [],
  cancelled: [],
};

export function canTransitionMoc(from: string, to: string) {
  return MOC_TRANSITIONS[from as MocStatus]?.includes(to as MocStatus) ?? false;
}

export async function validateMocLinkedRisk(
  supabase: SupabaseClient,
  input: { organizationId: string; riskAssessmentId: string; siteId?: string | null },
) {
  const { data, error } = await supabase
    .from("risk_assessments")
    .select("id, organization_id, status, site_id, assessment_number, deleted_at")
    .eq("id", input.riskAssessmentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.deleted_at) throw new Error("Linked risk assessment was not found");
  if (data.organization_id !== input.organizationId) {
    throw new Error("Cannot link a risk assessment from another organization");
  }
  if (data.status === "retired" || data.status === "cancelled") {
    throw new Error(`Risk assessment ${data.assessment_number} is ${data.status} and cannot be used`);
  }
  if (input.siteId && data.site_id && data.site_id !== input.siteId) {
    throw new Error(`Risk assessment ${data.assessment_number} site does not match the MOC site`);
  }
  return data;
}

async function requireMoc(supabase: SupabaseClient, organizationId: string, userId: string, permission: string) {
  await requireFeature(supabase, organizationId, "moc");
  await requirePermission(supabase, organizationId, userId, permission);
}

async function writeHistory(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    mocId: string;
    actorUserId: string;
    eventType: string;
    fromStatus?: string;
    toStatus?: string;
    message?: string;
  },
) {
  await supabase.from("moc_history").insert({
    organization_id: input.organizationId,
    moc_id: input.mocId,
    actor_user_id: input.actorUserId,
    event_type: input.eventType,
    from_status: input.fromStatus ?? null,
    to_status: input.toStatus ?? null,
    message: input.message ?? null,
  });
}

export async function getMocMetrics(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from("moc_requests")
    .select("status")
    .eq("organization_id", organizationId)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return {
    total: data?.length ?? 0,
    open: (data ?? []).filter((r) => !["closed", "cancelled"].includes(r.status)).length,
    approval: counts.approval ?? 0,
    implementation: counts.implementation ?? 0,
    verification: counts.post_change_verification ?? 0,
  };
}

export async function listMocRequests(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from("moc_requests")
    .select("id, moc_number, title, status, change_type, site_id, created_at, sites:site_id(name)")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMocBundle(
  supabase: SupabaseClient,
  organizationId: string,
  mocId: string,
) {
  const { data: moc, error } = await supabase
    .from("moc_requests")
    .select(
      "*, sites:site_id(id, name), risk_assessments:risk_assessment_id(id, assessment_number, title, status), training_courses:training_course_id(id, code, title)",
    )
    .eq("id", mocId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!moc) return null;

  const [impacts, approvals, history, documents, capas] = await Promise.all([
    supabase.from("moc_impacts").select("*").eq("organization_id", organizationId).eq("moc_id", mocId),
    supabase
      .from("moc_approvals")
      .select("*, profiles:approver_id(full_name, email)")
      .eq("organization_id", organizationId)
      .eq("moc_id", mocId)
      .order("decided_at", { ascending: false }),
    supabase
      .from("moc_history")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("moc_id", mocId)
      .order("created_at", { ascending: false }),
    listLinkedDocuments(supabase, organizationId, "moc", mocId),
    supabase
      .from("capa_items")
      .select("id, title, status, due_date")
      .eq("organization_id", organizationId)
      .eq("source_module", "moc")
      .eq("source_record_id", mocId)
      .is("deleted_at", null),
  ]);

  return {
    moc,
    impacts: impacts.data ?? [],
    approvals: approvals.data ?? [],
    history: history.data ?? [],
    documents,
    capas: capas.data ?? [],
  };
}

export async function createMocRequest(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    title: string;
    description?: string;
    siteId?: string;
    changeType?: string;
    currentState?: string;
    proposedState?: string;
    impactSummary?: string;
    impactAreas?: string[];
    riskAssessmentId?: string;
    trainingRequired?: boolean;
    trainingCourseId?: string;
  },
) {
  await requireMoc(supabase, input.organizationId, input.userId, "moc.manage");
  const title = input.title.trim();
  if (title.length < 2) throw new Error("Title is required");

  if (input.riskAssessmentId) {
    await validateMocLinkedRisk(supabase, {
      organizationId: input.organizationId,
      riskAssessmentId: input.riskAssessmentId,
      siteId: input.siteId,
    });
  }

  const { data: number, error: numErr } = await supabase.rpc("next_event_number", {
    p_organization_id: input.organizationId,
    p_sequence_key: "moc",
    p_prefix: "MOC-",
  });
  if (numErr) throw new Error(numErr.message);

  const { data, error } = await supabase
    .from("moc_requests")
    .insert({
      organization_id: input.organizationId,
      moc_number: number as string,
      title,
      description: input.description ?? null,
      site_id: input.siteId || null,
      requester_id: input.userId,
      owner_id: input.userId,
      status: "requested",
      change_type: input.changeType || null,
      current_state: input.currentState || null,
      proposed_state: input.proposedState || null,
      impact_summary: input.impactSummary || null,
      impact_areas: input.impactAreas ?? [],
      risk_assessment_id: input.riskAssessmentId || null,
      training_required: Boolean(input.trainingRequired),
      training_course_id: input.trainingCourseId || null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeHistory(supabase, {
    organizationId: input.organizationId,
    mocId: data.id,
    actorUserId: input.userId,
    eventType: "created",
    toStatus: "requested",
    message: `${data.moc_number} created`,
  });
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "moc.created",
    entityType: "moc_request",
    entityId: data.id,
  });
  return data;
}

export async function transitionMoc(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; mocId: string; toStatus: MocStatus; message?: string },
) {
  const permission =
    input.toStatus === "approval" || input.toStatus === "implementation" || input.toStatus === "cancelled"
      ? "moc.approve"
      : input.toStatus === "post_change_verification"
        ? "moc.implement"
        : input.toStatus === "closed"
          ? "moc.verify"
          : "moc.manage";
  await requireMoc(supabase, input.organizationId, input.userId, permission);

  const { data: moc } = await supabase
    .from("moc_requests")
    .select("*")
    .eq("id", input.mocId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!moc) throw new Error("MOC not found in this organization");
  if (!canTransitionMoc(moc.status, input.toStatus)) {
    throw new Error(`Cannot move MOC from ${moc.status} to ${input.toStatus}`);
  }

  if (input.toStatus === "approval" && moc.risk_assessment_id) {
    await validateMocLinkedRisk(supabase, {
      organizationId: input.organizationId,
      riskAssessmentId: moc.risk_assessment_id,
      siteId: moc.site_id,
    });
  }

  const patch: Record<string, unknown> = { status: input.toStatus };
  if (input.toStatus === "implementation") patch.implemented_at = new Date().toISOString();
  if (input.toStatus === "post_change_verification") {
    /* stay until verify */
  }
  if (input.toStatus === "closed") {
    patch.verified_at = new Date().toISOString();
    patch.verified_by = input.userId;
    patch.closed_at = new Date().toISOString();
  }
  if (input.toStatus === "cancelled") patch.cancelled_reason = input.message ?? "Cancelled";

  const { data, error } = await supabase
    .from("moc_requests")
    .update(patch)
    .eq("id", moc.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeHistory(supabase, {
    organizationId: input.organizationId,
    mocId: moc.id,
    actorUserId: input.userId,
    eventType: "status",
    fromStatus: moc.status,
    toStatus: input.toStatus,
    message: input.message,
  });
  return data;
}

export async function linkMocRisk(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; mocId: string; riskAssessmentId: string },
) {
  await requireMoc(supabase, input.organizationId, input.userId, "moc.manage");
  const { data: moc } = await supabase
    .from("moc_requests")
    .select("id, site_id")
    .eq("id", input.mocId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!moc) throw new Error("MOC not found in this organization");
  await validateMocLinkedRisk(supabase, {
    organizationId: input.organizationId,
    riskAssessmentId: input.riskAssessmentId,
    siteId: moc.site_id,
  });
  const { data, error } = await supabase
    .from("moc_requests")
    .update({ risk_assessment_id: input.riskAssessmentId, status: "risk_review" })
    .eq("id", moc.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeHistory(supabase, {
    organizationId: input.organizationId,
    mocId: moc.id,
    actorUserId: input.userId,
    eventType: "risk_linked",
    message: input.riskAssessmentId,
  });
  return data;
}

export async function addMocImpact(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    mocId: string;
    area: string;
    description?: string;
    severity?: "low" | "medium" | "high" | "critical";
  },
) {
  await requireMoc(supabase, input.organizationId, input.userId, "moc.manage");
  const { data: moc } = await supabase
    .from("moc_requests")
    .select("id")
    .eq("id", input.mocId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!moc) throw new Error("MOC not found in this organization");
  const { data, error } = await supabase
    .from("moc_impacts")
    .insert({
      organization_id: input.organizationId,
      moc_id: input.mocId,
      area: input.area.trim(),
      description: input.description ?? null,
      severity: input.severity ?? "medium",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function decideMocApproval(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    mocId: string;
    decision: "approved" | "rejected";
    comments?: string;
  },
) {
  await requireMoc(supabase, input.organizationId, input.userId, "moc.approve");
  const { data: moc } = await supabase
    .from("moc_requests")
    .select("*")
    .eq("id", input.mocId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!moc) throw new Error("MOC not found in this organization");
  if (moc.requester_id === input.userId) {
    throw new Error("Cannot approve your own MOC request");
  }

  await supabase.from("moc_approvals").insert({
    organization_id: input.organizationId,
    moc_id: moc.id,
    approver_id: input.userId,
    decision: input.decision,
    comments: input.comments ?? null,
  });

  const toStatus: MocStatus = input.decision === "approved" ? "implementation" : "cancelled";
  return transitionMoc(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    mocId: moc.id,
    toStatus,
    message: input.comments,
  });
}

export async function addMocAction(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    mocId: string;
    title: string;
    description?: string;
    ownerId?: string;
    dueDate?: string;
  },
) {
  await requireMoc(supabase, input.organizationId, input.userId, "moc.manage");
  const { data: moc } = await supabase
    .from("moc_requests")
    .select("id, moc_number")
    .eq("id", input.mocId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!moc) throw new Error("MOC not found in this organization");

  return createCapa(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    sourceModule: "moc",
    sourceRecordId: moc.id,
    title: input.title,
    description: input.description ?? `Action for ${moc.moc_number}`,
    ownerId: input.ownerId,
    dueDate: input.dueDate,
  });
}

export async function linkMocDocument(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; mocId: string; documentId: string },
) {
  await requireMoc(supabase, input.organizationId, input.userId, "moc.manage");
  const { data: moc } = await supabase
    .from("moc_requests")
    .select("id")
    .eq("id", input.mocId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!moc) throw new Error("MOC not found in this organization");
  return linkDocument(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    documentId: input.documentId,
    sourceType: "moc",
    sourceId: moc.id,
  });
}

export async function implementMoc(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; mocId: string; notes?: string },
) {
  await requireMoc(supabase, input.organizationId, input.userId, "moc.implement");
  const { data: moc } = await supabase
    .from("moc_requests")
    .select("*")
    .eq("id", input.mocId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!moc) throw new Error("MOC not found in this organization");

  if (moc.training_required && moc.training_course_id) {
    try {
      await assignTraining(supabase, {
        organizationId: input.organizationId,
        userId: input.userId,
        courseId: moc.training_course_id,
        assigneeId: moc.requester_id || input.userId,
      });
    } catch {
      /* Phase 9 training may be unentitled; implementation still proceeds */
    }
  }

  await supabase
    .from("moc_requests")
    .update({
      implementation_notes: input.notes ?? moc.implementation_notes,
    })
    .eq("id", moc.id)
    .eq("organization_id", input.organizationId);

  return transitionMoc(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    mocId: moc.id,
    toStatus: "post_change_verification",
    message: input.notes,
  });
}

export async function verifyMoc(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; mocId: string; notes?: string },
) {
  await requireMoc(supabase, input.organizationId, input.userId, "moc.verify");
  const { data: moc } = await supabase
    .from("moc_requests")
    .select("*")
    .eq("id", input.mocId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!moc) throw new Error("MOC not found in this organization");
  if (moc.requester_id === input.userId) {
    throw new Error("Verification must be completed by someone other than the requester");
  }

  await supabase
    .from("moc_requests")
    .update({ verification_notes: input.notes ?? null })
    .eq("id", moc.id)
    .eq("organization_id", input.organizationId);

  const closed = await transitionMoc(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    mocId: moc.id,
    toStatus: "closed",
    message: input.notes,
  });

  if (moc.owner_id) {
    await notifyUsers(supabase, {
      organizationId: input.organizationId,
      userIds: [moc.owner_id],
      title: `${moc.moc_number} verified and closed`,
      link: `/app/moc/${moc.id}`,
      actorUserId: input.userId,
      eventKey: "moc.closed",
    });
  }
  return closed;
}
