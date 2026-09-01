import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { requirePermission } from "@/lib/services/rbac";

export type VisitType = "hsv" | "rsv" | "tsv";
export type VisitStatus = "draft" | "submitted" | "allocated" | "closed" | "final_closed" | "cancelled";

const VISIT_CREATE_PERMISSION: Record<VisitType, string> = {
  hsv: "visits.hsv.create",
  rsv: "visits.rsv.create",
  tsv: "visits.tsv.create",
};

async function nextVisitNumber(supabase: SupabaseClient, organizationId: string, type: VisitType) {
  const { count } = await supabase
    .from("site_visits")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("visit_type", type)
    .is("deleted_at", null);
  const next = (count ?? 0) + 1;
  const year = new Date().getUTCFullYear();
  return `${type.toUpperCase()}-${year}-${String(next).padStart(5, "0")}`;
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
  const visitNumber = await nextVisitNumber(supabase, input.organizationId, input.visitType);
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
