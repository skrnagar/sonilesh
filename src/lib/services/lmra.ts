import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { DOCUMENT_NUMBER_KEYS, nextDocumentNumber } from "@/lib/services/document-numbers";
import { requirePermission } from "@/lib/services/rbac";
import { notifyUsers } from "@/lib/services/notifications";

export type LmraStatus = "draft" | "submitted" | "approved" | "rejected";

export async function listLmraAssessments(
  supabase: SupabaseClient,
  organizationId: string,
  filters?: { status?: LmraStatus; siteId?: string },
) {
  let query = supabase
    .from("lmra_assessments")
    .select("*, sites:site_id(name), projects:project_id(name)")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.siteId) query = query.eq("site_id", filters.siteId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createLmraAssessment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    activityDescription: string;
    siteId?: string | null;
    projectId?: string | null;
    risks?: unknown[];
    controls?: unknown[];
    immediateAction?: string;
    submit?: boolean;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "lmra.create");
  const { key, prefix } = DOCUMENT_NUMBER_KEYS.lmra(input.organizationId);
  const assessmentNumber = await nextDocumentNumber(supabase, input.organizationId, key, prefix);
  const status: LmraStatus = input.submit ? "submitted" : "draft";
  const { data, error } = await supabase
    .from("lmra_assessments")
    .insert({
      organization_id: input.organizationId,
      assessment_number: assessmentNumber,
      site_id: input.siteId ?? null,
      project_id: input.projectId ?? null,
      activity_description: input.activityDescription,
      risks: input.risks ?? [],
      controls: input.controls ?? [],
      immediate_action: input.immediateAction ?? null,
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
    action: "lmra.created",
    entityType: "lmra_assessment",
    entityId: data.id,
    newValues: data,
  });
  return data;
}

export async function reviewLmraAssessment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    assessmentId: string;
    decision: "approved" | "rejected";
    reviewNotes?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "lmra.approve");
  const { data: existing } = await supabase
    .from("lmra_assessments")
    .select("id, status, created_by")
    .eq("id", input.assessmentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!existing) throw new Error("LMRA not found");
  if (existing.status !== "submitted") {
    throw new Error("Only submitted LMRAs can be reviewed");
  }
  if (existing.created_by === input.userId) {
    throw new Error("Creator cannot approve their own LMRA");
  }
  const { data, error } = await supabase
    .from("lmra_assessments")
    .update({
      status: input.decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: input.userId,
      review_notes: input.reviewNotes ?? null,
      updated_by: input.userId,
    })
    .eq("id", input.assessmentId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  if (existing.created_by) {
    await notifyUsers(supabase, {
      organizationId: input.organizationId,
      userIds: [existing.created_by],
      actorUserId: input.userId,
      eventKey: "lmra.reviewed",
      title: `LMRA ${input.decision}`,
      body: input.reviewNotes ?? `Your LMRA was ${input.decision}`,
      link: `/app/lmra/${input.assessmentId}`,
    }).catch(() => undefined);
  }
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: `lmra.${input.decision}`,
    entityType: "lmra_assessment",
    entityId: input.assessmentId,
    reason: input.reviewNotes,
  });
  return data;
}

export async function createLmraFromFieldEvent(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    activityDescription: string;
    siteId?: string | null;
    projectId?: string | null;
    risks?: unknown[];
    controls?: unknown[];
    immediateAction?: string;
  },
) {
  return createLmraAssessment(supabase, { ...input, submit: true });
}
