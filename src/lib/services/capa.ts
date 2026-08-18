import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { requireFeature } from "@/lib/services/entitlements";
import { notifySiteSupervisors, notifyUsers } from "@/lib/services/notifications";
import { requirePermission } from "@/lib/services/rbac";

export type CapaSourceModule =
  | "incident"
  | "near_miss"
  | "hazard"
  | "unsafe_act"
  | "unsafe_condition"
  | "safety_observation"
  | "ehs_report"
  | "risk_assessment"
  | "inspection"
  | "audit"
  | "permit"
  | "training"
  | "contractor"
  | "other"
  | "action_item"
  | "compliance"
  | "moc";

export type CapaStatus =
  | "open"
  | "in_progress"
  | "pending_verification"
  | "verified"
  | "closed"
  | "cancelled";

const CAPA_TRANSITIONS: Record<CapaStatus, CapaStatus[]> = {
  open: ["in_progress", "cancelled"],
  in_progress: ["pending_verification", "cancelled"],
  pending_verification: ["verified", "in_progress", "cancelled"],
  verified: ["closed"],
  closed: [],
  cancelled: [],
};

export function canTransitionCapa(from: CapaStatus, to: CapaStatus) {
  return CAPA_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Derived overdue — not a stored status. */
export function isCapaOverdue(status: string, dueDate: string | null | undefined) {
  if (!dueDate) return false;
  if (["verified", "closed", "cancelled"].includes(status)) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dueDate < today;
}

export async function createCapa(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    sourceModule: CapaSourceModule;
    sourceRecordId: string;
    title: string;
    description?: string;
    type?: "corrective" | "preventive";
    ownerId?: string;
    priority?: "low" | "medium" | "high" | "critical";
    dueDate?: string;
    verificationRequired?: boolean;
    verificationMethod?: string;
    eventId?: string;
    isRequired?: boolean;
  },
) {
  await requireFeature(supabase, input.organizationId, "capa");
  await requirePermission(supabase, input.organizationId, input.userId, "capa.create");

  const { data, error } = await supabase
    .from("capa_items")
    .insert({
      organization_id: input.organizationId,
      source_module: input.sourceModule,
      source_record_id: input.sourceRecordId,
      event_id: input.eventId ?? null,
      title: input.title,
      description: input.description ?? null,
      capa_type: input.type ?? "corrective",
      status: "open",
      priority: input.priority ?? "medium",
      owner_id: input.ownerId ?? input.userId,
      due_date: input.dueDate ?? null,
      verification_required: input.verificationRequired ?? true,
      verification_method: input.verificationMethod ?? null,
      is_required: input.isRequired ?? true,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("capa_activity").insert({
    organization_id: input.organizationId,
    capa_id: data.id,
    action: "created",
    to_status: "open",
    actor_id: input.userId,
  });

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "capa.created",
    entityType: "capa",
    entityId: data.id,
    newValues: { title: data.title, source: input.sourceModule },
  });

  if (data.owner_id && data.owner_id !== input.userId) {
    await notifyUsers(supabase, {
      organizationId: input.organizationId,
      userIds: [data.owner_id],
      actorUserId: input.userId,
      eventKey: "capa.assigned",
      title: `CAPA assigned: ${data.title}`,
      body: data.description ?? "A corrective action was assigned to you.",
      link: `/app/capa`,
    }).catch((err) => console.error("[capa] notify owner failed", err));
  }

  return data;
}

export async function transitionCapa(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    capaId: string;
    toStatus: CapaStatus;
    evidence?: string;
    notes?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "capa.update");

  const { data: current } = await supabase
    .from("capa_items")
    .select("*")
    .eq("id", input.capaId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!current) throw new Error("CAPA not found");

  const from = current.status as CapaStatus;
  if (!canTransitionCapa(from, input.toStatus)) {
    throw new Error(`Cannot transition CAPA from ${from} to ${input.toStatus}`);
  }

  const patch: Record<string, unknown> = {
    status: input.toStatus,
    updated_by: input.userId,
  };
  if (input.evidence) patch.evidence = input.evidence;
  if (input.toStatus === "verified") {
    if (current.owner_id && current.owner_id === input.userId) {
      throw new Error("The CAPA owner cannot verify their own action. Another person must verify.");
    }
    await requirePermission(supabase, input.organizationId, input.userId, "capa.verify");
    patch.verified_by = input.userId;
    patch.verified_at = new Date().toISOString();
  }
  if (input.toStatus === "closed") {
    if (current.owner_id && current.owner_id === input.userId) {
      throw new Error("The CAPA owner cannot close their own action after completing it.");
    }
    patch.closed_at = new Date().toISOString();
    patch.closed_by = input.userId;
  }
  if (from === "pending_verification" && input.toStatus === "in_progress") {
    patch.rework_count = (current.rework_count ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from("capa_items")
    .update(patch)
    .eq("id", input.capaId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("capa_activity").insert({
    organization_id: input.organizationId,
    capa_id: input.capaId,
    action: "status_change",
    from_status: from,
    to_status: input.toStatus,
    notes: input.notes ?? null,
    actor_id: input.userId,
  });

  try {
    if (input.toStatus === "pending_verification") {
      await notifySiteSupervisors(supabase, {
        organizationId: input.organizationId,
        actorUserId: input.userId,
        eventKey: "capa.pending_verification",
        title: `CAPA ready for verification: ${current.title}`,
        body: input.notes ?? "An action is pending verification.",
        link: "/app/capa",
      });
    } else if (
      input.toStatus === "in_progress" &&
      from === "pending_verification" &&
      current.owner_id &&
      current.owner_id !== input.userId
    ) {
      await notifyUsers(supabase, {
        organizationId: input.organizationId,
        userIds: [current.owner_id],
        actorUserId: input.userId,
        eventKey: "capa.rework",
        title: `CAPA returned for rework: ${current.title}`,
        body: input.notes ?? "Verification was not accepted.",
        link: "/app/capa",
      });
    } else if (
      (input.toStatus === "verified" || input.toStatus === "closed") &&
      current.owner_id &&
      current.owner_id !== input.userId
    ) {
      await notifyUsers(supabase, {
        organizationId: input.organizationId,
        userIds: [current.owner_id],
        actorUserId: input.userId,
        eventKey: `capa.${input.toStatus}`,
        title: `CAPA ${input.toStatus}: ${current.title}`,
        body: input.notes ?? `Your action was ${input.toStatus}.`,
        link: "/app/capa",
      });
    }
  } catch (err) {
    console.error("[capa] notify failed", err);
  }

  return data;
}

export async function hasBlockingCapa(
  supabase: SupabaseClient,
  organizationId: string,
  sourceModule: string,
  sourceRecordId: string,
) {
  const { data, error } = await supabase.rpc("has_blocking_capa", {
    p_organization_id: organizationId,
    p_source_module: sourceModule,
    p_source_record_id: sourceRecordId,
  });
  if (error) {
    // Fallback if RPC not yet applied
    const { count } = await supabase
      .from("capa_items")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("source_module", sourceModule)
      .eq("source_record_id", sourceRecordId)
      .eq("is_required", true)
      .not("status", "in", '("verified","closed","cancelled")')
      .is("deleted_at", null);
    return (count ?? 0) > 0;
  }
  return Boolean(data);
}

export async function assertSourceClosable(
  supabase: SupabaseClient,
  organizationId: string,
  sourceModule: string,
  sourceRecordId: string,
) {
  const blocked = await hasBlockingCapa(
    supabase,
    organizationId,
    sourceModule,
    sourceRecordId,
  );
  if (blocked) {
    throw new Error(
      "Cannot close source record while required CAPA items remain open. Resolve or formally accept CAPA first.",
    );
  }
}

export async function getCapaDashboardStats(
  supabase: SupabaseClient,
  organizationId: string,
) {
  const openStatuses = ["open", "in_progress", "pending_verification"] as const;
  const [{ count: total }, { data: openRows }] = await Promise.all([
    supabase
      .from("capa_items")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    supabase
      .from("capa_items")
      .select("id, status, due_date, owner_id")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .in("status", [...openStatuses]),
  ]);

  const rows = openRows ?? [];
  const overdue = rows.filter((r) => isCapaOverdue(r.status, r.due_date));

  const byOwner: Record<string, number> = {};
  for (const r of rows) {
    const key = r.owner_id ?? "unassigned";
    byOwner[key] = (byOwner[key] ?? 0) + 1;
  }

  return {
    total: total ?? 0,
    open: rows.length,
    overdue: overdue.length,
    pendingVerification: rows.filter((r) => r.status === "pending_verification").length,
    byOwner,
    aging: {
      d0_7: overdue.filter((r) => daysPastDue(r.due_date) <= 7).length,
      d8_30: overdue.filter((r) => {
        const d = daysPastDue(r.due_date);
        return d >= 8 && d <= 30;
      }).length,
      d31_plus: overdue.filter((r) => daysPastDue(r.due_date) > 30).length,
    },
  };
}

function daysPastDue(dueDate: string | null) {
  if (!dueDate) return 0;
  const ms = Date.now() - new Date(dueDate).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}
