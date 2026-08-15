import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { requireFeature } from "@/lib/services/entitlements";
import { requirePermission } from "@/lib/services/rbac";

export type PermitStatus =
  | "requested"
  | "risk_check"
  | "pre_work_checklist"
  | "authorization"
  | "active"
  | "extension_pending"
  | "closeout"
  | "closed"
  | "cancelled"
  | "expired";

const PERMIT_TRANSITIONS: Record<PermitStatus, PermitStatus[]> = {
  requested: ["risk_check", "cancelled"],
  risk_check: ["pre_work_checklist", "cancelled"],
  pre_work_checklist: ["authorization", "cancelled"],
  authorization: ["active", "cancelled"],
  active: ["extension_pending", "closeout", "expired"],
  extension_pending: ["active", "closeout", "cancelled"],
  closeout: ["closed", "active"],
  closed: [],
  cancelled: [],
  expired: ["closeout", "cancelled"],
};

export function canTransitionPermit(from: PermitStatus, to: PermitStatus) {
  return PERMIT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isPermitExpired(status: string, validTo: string | null | undefined) {
  if (status === "expired") return true;
  if (!validTo) return false;
  if (!["active", "extension_pending"].includes(status)) return false;
  return new Date(validTo).getTime() < Date.now();
}

export function permitCountdown(validTo: string | null | undefined) {
  if (!validTo) return null;
  const ms = new Date(validTo).getTime() - Date.now();
  return {
    ms,
    expired: ms <= 0,
    hours: Math.floor(ms / (1000 * 60 * 60)),
    minutes: Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)),
  };
}

export function isExpiringSoon(validTo: string | null | undefined, withinHours = 4) {
  const c = permitCountdown(validTo);
  if (!c || c.expired) return false;
  return c.ms <= withinHours * 60 * 60 * 1000;
}

export async function createPermit(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    permitTypeCode: string;
    title: string;
    workDescription: string;
    siteId?: string;
    projectId?: string;
    riskAssessmentId?: string;
    validFrom?: string;
    validTo?: string;
    isolationLoto?: boolean;
  },
) {
  await requireFeature(supabase, input.organizationId, "permit_to_work");
  await requirePermission(supabase, input.organizationId, input.userId, "permits.create");

  const { data: typeRow } = await supabase
    .from("permit_types")
    .select("*")
    .eq("code", input.permitTypeCode)
    .or(`organization_id.eq.${input.organizationId},organization_id.is.null`)
    .order("organization_id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!typeRow) throw new Error("Permit type not found");

  if (typeRow.requires_risk_assessment && !input.riskAssessmentId) {
    throw new Error("Risk assessment is required for this permit type");
  }

  const { data: number, error: numErr } = await supabase.rpc("next_event_number", {
    p_organization_id: input.organizationId,
    p_sequence_key: "permit",
    p_prefix: "PTW-",
  });
  if (numErr) throw new Error(numErr.message);

  const validFrom = input.validFrom ?? new Date().toISOString();
  const validTo =
    input.validTo ??
    new Date(
      Date.now() + (typeRow.default_validity_hours ?? 8) * 60 * 60 * 1000,
    ).toISOString();

  const { data, error } = await supabase
    .from("permits")
    .insert({
      organization_id: input.organizationId,
      permit_type_id: typeRow.id,
      permit_number: number as string,
      title: input.title,
      work_description: input.workDescription,
      site_id: input.siteId ?? null,
      project_id: input.projectId ?? null,
      risk_assessment_id: input.riskAssessmentId ?? null,
      requester_id: input.userId,
      status: "requested",
      valid_from: validFrom,
      valid_to: validTo,
      isolation_loto_required: input.isolationLoto ?? input.permitTypeCode === "loto",
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "permit.created",
    entityType: "permit",
    entityId: data.id,
    newValues: { number: data.permit_number, type: input.permitTypeCode },
  });

  return data;
}

export async function transitionPermit(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    permitId: string;
    toStatus: PermitStatus;
    signatureName?: string;
    closeoutNotes?: string;
  },
) {
  const { data: current } = await supabase
    .from("permits")
    .select("*")
    .eq("id", input.permitId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!current) throw new Error("Permit not found");

  // Prevent use of expired permits
  if (
    isPermitExpired(current.status, current.valid_to) &&
    !["closeout", "closed", "cancelled", "expired"].includes(input.toStatus)
  ) {
    await supabase
      .from("permits")
      .update({ status: "expired", updated_by: input.userId })
      .eq("id", current.id);
    throw new Error("Permit has expired and cannot be used");
  }

  const from = current.status as PermitStatus;
  if (!canTransitionPermit(from, input.toStatus)) {
    throw new Error(`Cannot transition permit from ${from} to ${input.toStatus}`);
  }

  if (["authorization", "active"].includes(input.toStatus)) {
    await requirePermission(supabase, input.organizationId, input.userId, "permits.approve");
  } else if (input.toStatus === "closed") {
    await requirePermission(supabase, input.organizationId, input.userId, "permits.close");
  } else {
    await requirePermission(supabase, input.organizationId, input.userId, "permits.create");
  }

  if (input.toStatus === "active" && input.signatureName) {
    await supabase.from("permit_approvals").insert({
      organization_id: input.organizationId,
      permit_id: current.id,
      approver_role: "issuer",
      approver_id: input.userId,
      status: "approved",
      signature_name: input.signatureName,
      signed_at: new Date().toISOString(),
    });
  }

  const patch: Record<string, unknown> = {
    status: input.toStatus,
    updated_by: input.userId,
  };
  if (input.toStatus === "active") patch.issuer_id = input.userId;
  if (input.toStatus === "closed") {
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
  return data;
}

export async function listExpiringPermits(
  supabase: SupabaseClient,
  organizationId: string,
  withinHours = 24,
) {
  await supabase.rpc("expire_overdue_permits").maybeSingle();
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
