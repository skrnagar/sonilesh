import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { requirePermission } from "@/lib/services/rbac";

export type MisStatus = "draft" | "submitted" | "approved" | "rejected" | "cancelled";

async function nextMisNumber(supabase: SupabaseClient, organizationId: string) {
  const { count } = await supabase
    .from("mis_submissions")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("deleted_at", null);
  const next = (count ?? 0) + 1;
  const year = new Date().getUTCFullYear();
  return `MIS-${year}-${String(next).padStart(5, "0")}`;
}

export async function listMisSubmissions(
  supabase: SupabaseClient,
  organizationId: string,
  filters?: {
    status?: MisStatus;
    businessUnitId?: string;
    regionId?: string;
    siteId?: string;
    projectId?: string;
  },
) {
  let query = supabase
    .from("mis_submissions")
    .select(
      "*, mis_periods:period_id(label, period_start, period_end), sites:site_id(name), regions:region_id(name)",
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.businessUnitId) query = query.eq("business_unit_id", filters.businessUnitId);
  if (filters?.regionId) query = query.eq("region_id", filters.regionId);
  if (filters?.siteId) query = query.eq("site_id", filters.siteId);
  if (filters?.projectId) query = query.eq("project_id", filters.projectId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createMisSubmission(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    periodId: string;
    summary: string;
    businessUnitId?: string | null;
    regionId?: string | null;
    siteId?: string | null;
    projectId?: string | null;
    metrics?: Record<string, unknown>;
    submit?: boolean;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "mis.create");
  const submissionNumber = await nextMisNumber(supabase, input.organizationId);
  const status: MisStatus = input.submit ? "submitted" : "draft";
  const { data, error } = await supabase
    .from("mis_submissions")
    .insert({
      organization_id: input.organizationId,
      period_id: input.periodId,
      submission_number: submissionNumber,
      business_unit_id: input.businessUnitId ?? null,
      region_id: input.regionId ?? null,
      site_id: input.siteId ?? null,
      project_id: input.projectId ?? null,
      summary: input.summary,
      metrics: input.metrics ?? {},
      status,
      submitted_at: input.submit ? new Date().toISOString() : null,
      submitted_by: input.submit ? input.userId : null,
      created_by: input.userId,
      updated_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "mis.created",
    entityType: "mis_submission",
    entityId: data.id,
    newValues: data,
  });
  return data;
}

export async function reviewMisSubmission(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    submissionId: string;
    decision: "approved" | "rejected";
    reviewNotes?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "mis.approve");
  const { data: existing } = await supabase
    .from("mis_submissions")
    .select("id, status")
    .eq("id", input.submissionId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!existing) throw new Error("MIS submission not found");
  if (existing.status !== "submitted") {
    throw new Error("Only submitted MIS records can be reviewed");
  }
  const { data, error } = await supabase
    .from("mis_submissions")
    .update({
      status: input.decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: input.userId,
      review_notes: input.reviewNotes ?? null,
      updated_by: input.userId,
    })
    .eq("id", input.submissionId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: `mis.${input.decision}`,
    entityType: "mis_submission",
    entityId: input.submissionId,
    reason: input.reviewNotes,
  });
  return data;
}

export async function ensureMisPeriod(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const label = start.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  const { data: existing } = await supabase
    .from("mis_periods")
    .select("id, label")
    .eq("organization_id", organizationId)
    .eq("period_start", start.toISOString().slice(0, 10))
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("mis_periods")
    .insert({
      organization_id: organizationId,
      label,
      period_start: start.toISOString().slice(0, 10),
      period_end: end.toISOString().slice(0, 10),
      status: "open",
      created_by: userId,
      updated_by: userId,
    })
    .select("id, label")
    .single();
  if (error) throw new Error(error.message);
  return data;
}
