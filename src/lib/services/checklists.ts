import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { requireFeature } from "@/lib/services/entitlements";
import { requirePermission } from "@/lib/services/rbac";
import { createCapa } from "@/lib/services/capa";

export type ChecklistType = "inspection" | "audit";
export type QuestionType =
  | "pass_fail"
  | "yes_no"
  | "na"
  | "text"
  | "number"
  | "date"
  | "single_select"
  | "multi_select"
  | "photo"
  | "signature";

export async function createChecklistTemplate(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    code: string;
    name: string;
    checklistType: ChecklistType;
    autoCapaOnFail?: boolean;
  },
) {
  const feature = input.checklistType === "audit" ? "audits" : "inspections";
  await requireFeature(supabase, input.organizationId, feature);
  await requirePermission(supabase, input.organizationId, input.userId, "checklists.manage");

  const { data, error } = await supabase
    .from("checklist_templates")
    .insert({
      organization_id: input.organizationId,
      code: input.code,
      name: input.name,
      checklist_type: input.checklistType,
      auto_capa_on_fail: input.autoCapaOnFail ?? false,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function addSectionWithQuestions(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    templateId: string;
    title: string;
    sortOrder?: number;
    questions: Array<{
      prompt: string;
      questionType: QuestionType;
      isRequired?: boolean;
      options?: Array<{ label: string; value: string; isFailing?: boolean; score?: number }>;
    }>;
  },
) {
  const { data: section, error } = await supabase
    .from("checklist_sections")
    .insert({
      organization_id: input.organizationId,
      template_id: input.templateId,
      title: input.title,
      sort_order: input.sortOrder ?? 0,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  for (let i = 0; i < input.questions.length; i++) {
    const q = input.questions[i];
    const { data: question, error: qErr } = await supabase
      .from("checklist_questions")
      .insert({
        organization_id: input.organizationId,
        section_id: section.id,
        prompt: q.prompt,
        question_type: q.questionType,
        is_required: q.isRequired ?? true,
        sort_order: i,
      })
      .select("*")
      .single();
    if (qErr) throw new Error(qErr.message);

    if (q.options?.length) {
      const { error: oErr } = await supabase.from("checklist_options").insert(
        q.options.map((o, idx) => ({
          organization_id: input.organizationId,
          question_id: question.id,
          label: o.label,
          value: o.value,
          is_failing: o.isFailing ?? false,
          score: o.score ?? null,
          sort_order: idx,
        })),
      );
      if (oErr) throw new Error(oErr.message);
    }
  }

  return section;
}

export async function createAssignment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    templateId: string;
    title: string;
    checklistType: ChecklistType;
    assigneeId?: string;
    siteId?: string;
    scheduledFor?: string;
  },
) {
  const feature = input.checklistType === "audit" ? "audits" : "inspections";
  const permission = input.checklistType === "audit" ? "audits.conduct" : "inspections.conduct";
  await requireFeature(supabase, input.organizationId, feature);
  await requirePermission(supabase, input.organizationId, input.userId, permission);

  const prefix = input.checklistType === "audit" ? "AUD-" : "INS-";
  const { data: number, error: numErr } = await supabase.rpc("next_event_number", {
    p_organization_id: input.organizationId,
    p_sequence_key: input.checklistType,
    p_prefix: prefix,
  });
  if (numErr) throw new Error(numErr.message);

  const status = input.checklistType === "audit" ? "planned" : "scheduled";
  const { data, error } = await supabase
    .from("checklist_assignments")
    .insert({
      organization_id: input.organizationId,
      template_id: input.templateId,
      assignment_number: number as string,
      checklist_type: input.checklistType,
      title: input.title,
      status,
      assignee_id: input.assigneeId ?? input.userId,
      site_id: input.siteId ?? null,
      scheduled_for: input.scheduledFor ?? null,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: `${input.checklistType}.assigned`,
    entityType: "checklist_assignment",
    entityId: data.id,
  });

  return data;
}

export function computeScore(
  responses: Array<{ score: number | null; is_na: boolean }>,
  totalWeight: number,
) {
  if (totalWeight <= 0) return null;
  const earned = responses
    .filter((r) => !r.is_na)
    .reduce((sum, r) => sum + (r.score ?? 0), 0);
  return Math.round((earned / totalWeight) * 10000) / 100;
}

export async function recordResponse(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    assignmentId: string;
    questionId: string;
    valueText?: string;
    valueNumber?: number;
    valueDate?: string;
    valueJson?: unknown;
    isNa?: boolean;
    comment?: string;
    photoUrl?: string;
    signatureName?: string;
    score?: number;
    isFailing?: boolean;
    autoCapa?: boolean;
    findingTitle?: string;
  },
) {
  const { data, error } = await supabase
    .from("checklist_responses")
    .upsert(
      {
        organization_id: input.organizationId,
        assignment_id: input.assignmentId,
        question_id: input.questionId,
        value_text: input.valueText ?? null,
        value_number: input.valueNumber ?? null,
        value_date: input.valueDate ?? null,
        value_json: input.valueJson ?? null,
        is_na: input.isNa ?? false,
        comment: input.comment ?? null,
        photo_url: input.photoUrl ?? null,
        signature_name: input.signatureName ?? null,
        score: input.score ?? null,
        answered_by: input.userId,
        answered_at: new Date().toISOString(),
      },
      { onConflict: "assignment_id,question_id" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  if (input.isFailing) {
    let capaId: string | null = null;
    if (input.autoCapa) {
      const capa = await createCapa(supabase, {
        organizationId: input.organizationId,
        userId: input.userId,
        sourceModule: "inspection",
        sourceRecordId: input.assignmentId,
        title: input.findingTitle || `Finding from checklist response`,
        description: input.comment || input.valueText,
      });
      capaId = capa.id;
    }
    await supabase.from("checklist_findings").insert({
      organization_id: input.organizationId,
      assignment_id: input.assignmentId,
      response_id: data.id,
      title: input.findingTitle || "Checklist finding",
      description: input.comment ?? null,
      capa_id: capaId,
      status: capaId ? "capa_linked" : "open",
      created_by: input.userId,
    });
  }

  return data;
}
