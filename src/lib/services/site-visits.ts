import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { DOCUMENT_NUMBER_KEYS, nextDocumentNumber } from "@/lib/services/document-numbers";
import { requirePermission } from "@/lib/services/rbac";

export type VisitType = "hsv" | "rsv" | "tsv";
export type VisitStatus = "draft" | "submitted" | "allocated" | "closed" | "final_closed" | "cancelled";

const VISIT_CREATE_PERMISSION: Record<VisitType, string> = {
  hsv: "visits.hsv.create",
  rsv: "visits.rsv.create",
  tsv: "visits.tsv.create",
};

/** Valid forward transitions enforced in service + DB trigger. */
export const SITE_VISIT_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["allocated", "cancelled"],
  allocated: ["closed", "cancelled"],
  closed: ["final_closed"],
  final_closed: [],
  cancelled: [],
};

export function canTransitionSiteVisit(from: VisitStatus, to: VisitStatus) {
  return SITE_VISIT_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function listSiteVisits(
  supabase: SupabaseClient,
  organizationId: string,
  filters?: { visitType?: VisitType; siteId?: string },
) {
  let query = supabase
    .from("site_visits")
    .select("*, sites:site_id(name), regions:region_id(name)")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("visit_date", { ascending: false })
    .limit(100);
  if (filters?.visitType) query = query.eq("visit_type", filters.visitType);
  if (filters?.siteId) query = query.eq("site_id", filters.siteId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createSiteVisit(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    visitType: VisitType;
    summary: string;
    visitDate?: string;
    siteId?: string | null;
    projectId?: string | null;
    regionId?: string | null;
    businessUnitId?: string | null;
    submit?: boolean;
  },
) {
  const permission = VISIT_CREATE_PERMISSION[input.visitType];
  await requirePermission(supabase, input.organizationId, input.userId, permission);
  const { key, prefix } = DOCUMENT_NUMBER_KEYS.siteVisit(input.organizationId, input.visitType);
  const visitNumber = await nextDocumentNumber(supabase, input.organizationId, key, prefix);
  const status: VisitStatus = input.submit ? "submitted" : "draft";
  const { data, error } = await supabase
    .from("site_visits")
    .insert({
      organization_id: input.organizationId,
      visit_number: visitNumber,
      visit_type: input.visitType,
      visit_date: input.visitDate ?? new Date().toISOString().slice(0, 10),
      summary: input.summary,
      site_id: input.siteId ?? null,
      project_id: input.projectId ?? null,
      region_id: input.regionId ?? null,
      business_unit_id: input.businessUnitId ?? null,
      status,
      created_by: input.userId,
      updated_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "site_visit.created",
    entityType: "site_visit",
    entityId: data.id,
    newValues: data,
  });
  return data;
}

export async function transitionSiteVisit(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    visitId: string;
    toStatus: VisitStatus;
    assignedTo?: string | null;
    note?: string;
  },
) {
  const { data: existing, error: loadError } = await supabase
    .from("site_visits")
    .select("id, status, visit_type, created_by")
    .eq("id", input.visitId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (loadError) throw new Error(loadError.message);
  if (!existing) throw new Error("Site visit not found");

  const fromStatus = existing.status as VisitStatus;
  if (!canTransitionSiteVisit(fromStatus, input.toStatus)) {
    throw new Error(`Invalid site visit transition: ${fromStatus} → ${input.toStatus}`);
  }

  if (input.toStatus === "submitted") {
    const permission = VISIT_CREATE_PERMISSION[existing.visit_type as VisitType];
    await requirePermission(supabase, input.organizationId, input.userId, permission);
  } else if (input.toStatus === "allocated" || input.toStatus === "closed") {
    await requirePermission(supabase, input.organizationId, input.userId, "visits.allocate");
  } else if (input.toStatus === "final_closed") {
    await requirePermission(supabase, input.organizationId, input.userId, "visits.final_close");
  } else if (input.toStatus === "cancelled") {
    if (existing.created_by !== input.userId) {
      await requirePermission(supabase, input.organizationId, input.userId, "visits.allocate");
    }
  }

  const patch: Record<string, unknown> = {
    status: input.toStatus,
    updated_by: input.userId,
  };
  if (input.toStatus === "allocated" && input.assignedTo) {
    patch.assigned_to = input.assignedTo;
  }

  const { data, error } = await supabase
    .from("site_visits")
    .update(patch)
    .eq("id", input.visitId)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: `site_visit.${input.toStatus}`,
    entityType: "site_visit",
    entityId: input.visitId,
    reason: input.note,
    newValues: { from: fromStatus, to: input.toStatus },
  });

  return data;
}
