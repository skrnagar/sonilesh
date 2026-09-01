import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { DOCUMENT_NUMBER_KEYS, nextDocumentNumber } from "@/lib/services/document-numbers";
import { requirePermission } from "@/lib/services/rbac";

export type MisStatus = "draft" | "submitted" | "approved" | "rejected" | "cancelled";

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

  const { data: period, error: periodError } = await supabase
    .from("mis_periods")
    .select("id, status, organization_id")
    .eq("id", input.periodId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (periodError) throw new Error(periodError.message);
  if (!period) throw new Error("MIS period not found");
  if (period.status !== "open") {
    throw new Error("MIS period is not open for submissions");
  }

  let duplicateQuery = supabase
    .from("mis_submissions")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("period_id", input.periodId)
    .is("deleted_at", null)
    .neq("status", "cancelled");
  if (input.projectId) duplicateQuery = duplicateQuery.eq("project_id", input.projectId);
  else duplicateQuery = duplicateQuery.is("project_id", null);
  const { data: duplicate } = await duplicateQuery.maybeSingle();
  if (duplicate) {
    throw new Error("An MIS submission already exists for this period and project scope");
  }

  const { key, prefix } = DOCUMENT_NUMBER_KEYS.mis(input.organizationId);
  const submissionNumber = await nextDocumentNumber(supabase, input.organizationId, key, prefix);
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

  const { data, error } = await supabase.rpc("ensure_mis_period", {
    p_organization_id: organizationId,
    p_period_start: start.toISOString().slice(0, 10),
    p_period_end: end.toISOString().slice(0, 10),
    p_label: label,
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
  return data as { id: string; label: string };
}
