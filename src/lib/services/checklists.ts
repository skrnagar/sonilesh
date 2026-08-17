import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { requireFeature } from "@/lib/services/entitlements";
import { requirePermission } from "@/lib/services/rbac";
import { createCapa } from "@/lib/services/capa";
import { notifyUsers } from "@/lib/services/notifications";

/** Primary product types; engine also accepts equipment/vehicle/… for future modules */
export type ChecklistType =
  | "inspection"
  | "audit"
  | "equipment"
  | "vehicle"
  | "behavioral"
  | "contractor"
  | "training"
  | "compliance"
  | "environmental"
  | "general"
  | "permit"
  | "ppe";

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

export const INSPECTION_TRANSITIONS: Record<string, string[]> = {
  draft: ["scheduled", "assigned", "cancelled"],
  scheduled: ["assigned", "in_progress", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: ["findings_review", "under_review", "closed"],
  findings_review: ["capa", "under_review", "closed"],
  under_review: ["approved", "in_progress", "closed"],
  approved: ["closed", "capa"],
  capa: ["closed"],
  closed: [],
  cancelled: [],
};

export const AUDIT_TRANSITIONS: Record<string, string[]> = {
  draft: ["planned", "cancelled"],
  planned: ["auditee_notified", "in_progress", "cancelled"],
  auditee_notified: ["in_progress", "cancelled"],
  in_progress: ["conducted", "completed", "cancelled"],
  conducted: ["findings_recorded", "completed"],
  findings_recorded: ["categorized", "findings_review"],
  categorized: ["capa_linked", "under_review"],
  capa_linked: ["report_issued", "closed"],
  completed: ["findings_review", "under_review", "report_issued"],
  findings_review: ["under_review", "capa", "closed"],
  under_review: ["approved", "report_issued", "closed"],
  approved: ["report_issued", "closed"],
  report_issued: ["closed"],
  capa: ["closed"],
  closed: [],
  cancelled: [],
};

function featureFor(type: ChecklistType) {
  if (type === "audit") return "audits";
  if (type === "contractor") return "contractor_management";
  if (type === "ppe") return "ppe_management";
  if (type === "compliance" || type === "environmental") return "regulatory_compliance";
  return "inspections";
}

function conductPerm(type: ChecklistType) {
  if (type === "audit") return "audits.conduct";
  if (type === "contractor") return "contractor.update";
  if (type === "ppe") return "ppe.inspect";
  if (type === "compliance" || type === "environmental") return "compliance.assess";
  return "inspections.conduct";
}

export function canTransitionChecklist(
  checklistType: ChecklistType,
  from: string,
  to: string,
) {
  const map = checklistType === "audit" ? AUDIT_TRANSITIONS : INSPECTION_TRANSITIONS;
  return map[from]?.includes(to) ?? false;
}

export function computeScore(
  responses: Array<{ score: number | null; is_na: boolean }>,
  totalWeight: number,
) {
  if (totalWeight <= 0) return null;
  const earned = responses
    .filter((r) => !r.is_na)
    .reduce((sum, r) => sum + (Number(r.score) || 0), 0);
  return Math.round((earned / totalWeight) * 10000) / 100;
}

async function logActivity(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    assignmentId: string;
    actorUserId: string;
    eventType: string;
    message: string;
    metadata?: Record<string, unknown>;
  },
) {
  await supabase.from("checklist_activity").insert({
    organization_id: input.organizationId,
    assignment_id: input.assignmentId,
    actor_user_id: input.actorUserId,
    event_type: input.eventType,
    message: input.message,
    metadata: input.metadata ?? {},
  });
}

export async function ensureDefaultTemplates(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
) {
  const seeds: Array<{
    code: string;
    name: string;
    checklistType: ChecklistType;
    autoCapa: boolean;
    section: string;
    questions: Array<{ prompt: string; type: QuestionType; failing?: string[] }>;
  }> = [
    {
      code: "site_safety_walk",
      name: "Site Safety Walk",
      checklistType: "inspection",
      autoCapa: true,
      section: "General",
      questions: [
        { prompt: "Housekeeping acceptable", type: "pass_fail", failing: ["fail"] },
        { prompt: "PPE compliance observed", type: "pass_fail", failing: ["fail"] },
        { prompt: "Emergency exits clear", type: "pass_fail", failing: ["fail"] },
        { prompt: "Fire extinguishers accessible", type: "pass_fail", failing: ["fail"] },
        { prompt: "Additional observations", type: "text" },
      ],
    },
    {
      code: "iso_internal_audit",
      name: "Internal Management System Audit",
      checklistType: "audit",
      autoCapa: true,
      section: "Clause checks",
      questions: [
        { prompt: "Document control effective", type: "pass_fail", failing: ["fail"] },
        { prompt: "Competence records current", type: "pass_fail", failing: ["fail"] },
        { prompt: "Incident reporting process followed", type: "pass_fail", failing: ["fail"] },
        { prompt: "Nonconformity notes", type: "text" },
      ],
    },
  ];

  for (const seed of seeds) {
    const { data: existing } = await supabase
      .from("checklist_templates")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("code", seed.code)
      .is("deleted_at", null)
      .maybeSingle();
    if (existing) continue;

    const tpl = await createChecklistTemplate(supabase, {
      organizationId,
      userId,
      code: seed.code,
      name: seed.name,
      checklistType: seed.checklistType,
      autoCapaOnFail: seed.autoCapa,
    });
    await addSectionWithQuestions(supabase, {
      organizationId,
      templateId: tpl.id,
      title: seed.section,
      questions: seed.questions.map((q) => ({
        prompt: q.prompt,
        questionType: q.type,
        isRequired: q.type !== "text",
        options:
          q.type === "pass_fail"
            ? [
                { label: "Pass", value: "pass", score: 1, isFailing: false },
                { label: "Fail", value: "fail", score: 0, isFailing: true },
                { label: "N/A", value: "na", score: 0, isFailing: false },
              ]
            : undefined,
      })),
    });
  }
}

export async function createChecklistTemplate(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    code: string;
    name: string;
    checklistType: ChecklistType;
    autoCapaOnFail?: boolean;
    scoringEnabled?: boolean;
    passThresholdPercent?: number;
    requiresReview?: boolean;
    description?: string;
  },
) {
  await requireFeature(supabase, input.organizationId, featureFor(input.checklistType));
  await requirePermission(supabase, input.organizationId, input.userId, "checklists.manage");

  const { data, error } = await supabase
    .from("checklist_templates")
    .insert({
      organization_id: input.organizationId,
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      checklist_type: input.checklistType,
      auto_capa_on_fail: input.autoCapaOnFail ?? false,
      scoring_enabled: input.scoringEnabled ?? true,
      pass_threshold_percent: input.passThresholdPercent ?? 80,
      requires_review: input.requiresReview ?? false,
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
      weight?: number;
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
        weight: q.weight ?? 1,
        sort_order: i,
        failing_values: (q.options ?? [])
          .filter((o) => o.isFailing)
          .map((o) => o.value),
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

export async function listTemplates(
  supabase: SupabaseClient,
  organizationId: string,
  checklistType?: ChecklistType,
) {
  let q = supabase
    .from("checklist_templates")
    .select("*")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("name");
  if (checklistType) q = q.eq("checklist_type", checklistType);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTemplateBundle(
  supabase: SupabaseClient,
  organizationId: string,
  templateId: string,
) {
  const { data: template, error } = await supabase
    .from("checklist_templates")
    .select("*")
    .eq("id", templateId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!template) return null;

  const { data: sections } = await supabase
    .from("checklist_sections")
    .select("*")
    .eq("template_id", templateId)
    .order("sort_order");

  const sectionIds = (sections ?? []).map((s) => s.id);
  const { data: questions } = sectionIds.length
    ? await supabase
        .from("checklist_questions")
        .select("*, checklist_options(*)")
        .in("section_id", sectionIds)
        .order("sort_order")
    : { data: [] };

  return { template, sections: sections ?? [], questions: questions ?? [] };
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
    projectId?: string;
    departmentId?: string;
    locationId?: string;
    scheduledFor?: string;
    dueDate?: string;
    description?: string;
    priority?: string;
    auditeeId?: string;
  },
) {
  await requireFeature(supabase, input.organizationId, featureFor(input.checklistType));
  await requirePermission(supabase, input.organizationId, input.userId, conductPerm(input.checklistType));

  const { data: template } = await supabase
    .from("checklist_templates")
    .select("id, organization_id, is_active, checklist_type")
    .eq("id", input.templateId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!template || !template.is_active) throw new Error("Checklist template not found or inactive");

  if (input.siteId) {
    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("id", input.siteId)
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!site) throw new Error("Site must belong to this organization");
  }

  const prefix =
    input.checklistType === "audit"
      ? "AUD-"
      : input.checklistType === "contractor"
        ? "CPQ-"
        : input.checklistType === "compliance"
          ? "CMP-"
          : input.checklistType === "ppe"
            ? "PPE-"
            : "INS-";
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
      description: input.description ?? null,
      status,
      assignee_id: input.assigneeId ?? input.userId,
      auditee_id: input.auditeeId ?? null,
      site_id: input.siteId ?? null,
      project_id: input.projectId ?? null,
      department_id: input.departmentId ?? null,
      location_id: input.locationId ?? null,
      scheduled_for: input.scheduledFor ?? null,
      due_date: input.dueDate ?? null,
      priority: input.priority ?? "normal",
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

  await logActivity(supabase, {
    organizationId: input.organizationId,
    assignmentId: data.id,
    actorUserId: input.userId,
    eventType: "created",
    message: `${data.assignment_number} created`,
  });

  if (data.assignee_id && data.assignee_id !== input.userId) {
    await notifyUsers(supabase, {
      organizationId: input.organizationId,
      userIds: [data.assignee_id],
      title: `Assigned: ${data.assignment_number}`,
      body: data.title,
      link:
        input.checklistType === "audit"
          ? `/app/audits/${data.id}`
          : `/app/inspections/${data.id}`,
      actorUserId: input.userId,
      eventKey:
        input.checklistType === "audit" ? "audit.assigned" : "inspection.assigned",
    });
  }

  return data;
}

export async function listAssignments(
  supabase: SupabaseClient,
  organizationId: string,
  opts?: {
    checklistType?: ChecklistType;
    status?: string;
    siteId?: string;
    assigneeId?: string;
    limit?: number;
  },
) {
  let q = supabase
    .from("checklist_assignments")
    .select(
      `
      id, assignment_number, title, status, scheduled_for, due_date, score_percent,
      findings_count, priority, checklist_type, assignee_id, site_id,
      sites:site_id(name),
      checklist_templates:template_id(name, code)
    `,
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 100);

  if (opts?.checklistType) q = q.eq("checklist_type", opts.checklistType);
  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.siteId) q = q.eq("site_id", opts.siteId);
  if (opts?.assigneeId) q = q.eq("assignee_id", opts.assigneeId);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAssignmentBundle(
  supabase: SupabaseClient,
  organizationId: string,
  assignmentId: string,
) {
  const { data: assignment, error } = await supabase
    .from("checklist_assignments")
    .select(
      `
      *,
      checklist_templates:template_id(*),
      sites:site_id(id, name),
      projects:project_id(id, name)
    `,
    )
    .eq("id", assignmentId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!assignment) return null;

  const templateId = assignment.template_id as string;
  const [{ data: sections }, { data: responses }, { data: findings }, { data: activity }, { data: evidence }] =
    await Promise.all([
      supabase
        .from("checklist_sections")
        .select("*")
        .eq("template_id", templateId)
        .order("sort_order"),
      supabase.from("checklist_responses").select("*").eq("assignment_id", assignmentId),
      supabase
        .from("checklist_findings")
        .select("*, finding_categories:category_id(code, name)")
        .eq("assignment_id", assignmentId)
        .is("deleted_at", null),
      supabase
        .from("checklist_activity")
        .select("*")
        .eq("assignment_id", assignmentId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("checklist_evidence")
        .select("*")
        .eq("assignment_id", assignmentId)
        .order("created_at", { ascending: false }),
    ]);

  const sectionIds = (sections ?? []).map((s) => s.id);
  const { data: questions } = sectionIds.length
    ? await supabase
        .from("checklist_questions")
        .select("*, checklist_options(*)")
        .in("section_id", sectionIds)
        .order("sort_order")
    : { data: [] };

  return {
    assignment,
    sections: sections ?? [],
    questions: questions ?? [],
    responses: responses ?? [],
    findings: findings ?? [],
    activity: activity ?? [],
    evidence: evidence ?? [],
  };
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
    storagePath?: string;
    signatureName?: string;
    score?: number;
    isFailing?: boolean;
    autoCapa?: boolean;
    findingTitle?: string;
    checklistType?: ChecklistType;
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
        is_failing: input.isFailing ?? false,
        comment: input.comment ?? null,
        photo_url: input.photoUrl ?? null,
        storage_path: input.storagePath ?? input.photoUrl ?? null,
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
    const { data: existingFinding } = await supabase
      .from("checklist_findings")
      .select("id")
      .eq("assignment_id", input.assignmentId)
      .eq("response_id", data.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!existingFinding) {
      let capaId: string | null = null;
      const sourceModule =
        input.checklistType === "audit" ? "audit" : "inspection";
      if (input.autoCapa) {
        const capa = await createCapa(supabase, {
          organizationId: input.organizationId,
          userId: input.userId,
          sourceModule,
          sourceRecordId: input.assignmentId,
          title: input.findingTitle || "Finding from checklist response",
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
  }

  return data;
}

export async function completeAssignment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    assignmentId: string;
    reportNotes?: string;
  },
) {
  const bundle = await getAssignmentBundle(
    supabase,
    input.organizationId,
    input.assignmentId,
  );
  if (!bundle) throw new Error("Assignment not found");

  const type = bundle.assignment.checklist_type as ChecklistType;
  await requirePermission(supabase, input.organizationId, input.userId, conductPerm(type));

  const questions = bundle.questions;
  const totalWeight = questions
    .filter((q) => {
      const resp = bundle.responses.find((r) => r.question_id === q.id);
      return !(resp?.is_na);
    })
    .reduce((sum, q) => sum + Number(q.weight ?? 1), 0);

  const scored = bundle.responses.map((r) => ({
    score: r.score as number | null,
    is_na: Boolean(r.is_na),
  }));
  const scorePercent = computeScore(scored, totalWeight || questions.length || 1);
  const findingsCount = bundle.findings.length;

  const nextStatus =
    type === "audit"
      ? findingsCount
        ? "findings_recorded"
        : "conducted"
      : findingsCount
        ? "findings_review"
        : "completed";

  const { data, error } = await supabase
    .from("checklist_assignments")
    .update({
      status: nextStatus,
      completed_at: new Date().toISOString(),
      score_percent: scorePercent,
      total_score: scored.filter((r) => !r.is_na).reduce((s, r) => s + (Number(r.score) || 0), 0),
      max_possible_score: totalWeight,
      findings_count: findingsCount,
      report_notes: input.reportNotes ?? null,
      updated_by: input.userId,
    })
    .eq("id", input.assignmentId)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    organizationId: input.organizationId,
    assignmentId: input.assignmentId,
    actorUserId: input.userId,
    eventType: "completed",
    message: `Completed with score ${scorePercent ?? "—"}%`,
    metadata: { scorePercent, findingsCount },
  });

  return data;
}

export async function transitionAssignment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    assignmentId: string;
    toStatus: string;
    reportNotes?: string;
  },
) {
  const { data: current } = await supabase
    .from("checklist_assignments")
    .select("*")
    .eq("id", input.assignmentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!current) throw new Error("Assignment not found");

  const type = current.checklist_type as ChecklistType;
  if (!canTransitionChecklist(type, current.status, input.toStatus)) {
    throw new Error(`Cannot transition from ${current.status} to ${input.toStatus}`);
  }

  if (["approved", "report_issued", "closed"].includes(input.toStatus)) {
    const reviewPerm = type === "audit" ? "audits.review" : "inspections.review";
    try {
      await requirePermission(supabase, input.organizationId, input.userId, reviewPerm);
    } catch {
      await requirePermission(
        supabase,
        input.organizationId,
        input.userId,
        type === "audit" ? "audits.close" : "inspections.close",
      );
    }
  } else {
    await requirePermission(supabase, input.organizationId, input.userId, conductPerm(type));
  }

  const patch: Record<string, unknown> = {
    status: input.toStatus,
    updated_by: input.userId,
  };
  if (input.toStatus === "in_progress" && !current.started_at) {
    patch.started_at = new Date().toISOString();
  }
  if (input.toStatus === "approved") {
    patch.approved_by = input.userId;
    patch.approved_at = new Date().toISOString();
  }
  if (input.toStatus === "under_review") {
    patch.reviewer_id = input.userId;
    patch.reviewed_at = new Date().toISOString();
  }
  if (input.reportNotes) patch.report_notes = input.reportNotes;

  const { data, error } = await supabase
    .from("checklist_assignments")
    .update(patch)
    .eq("id", input.assignmentId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: `${type}.status_changed`,
    entityType: "checklist_assignment",
    entityId: input.assignmentId,
    previousValues: { status: current.status },
    newValues: { status: input.toStatus },
  });

  await logActivity(supabase, {
    organizationId: input.organizationId,
    assignmentId: input.assignmentId,
    actorUserId: input.userId,
    eventType: "status_change",
    message: `Status ${current.status} → ${input.toStatus}`,
  });

  return data;
}

export async function listFindings(
  supabase: SupabaseClient,
  organizationId: string,
  opts?: { status?: string; assignmentId?: string; limit?: number },
) {
  let q = supabase
    .from("checklist_findings")
    .select(
      `
      id, title, description, status, created_at, due_date, capa_id,
      checklist_assignments:assignment_id(id, assignment_number, title, checklist_type, site_id),
      finding_categories:category_id(code, name)
    `,
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 100);
  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.assignmentId) q = q.eq("assignment_id", opts.assignmentId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateFinding(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    findingId: string;
    categoryId?: string;
    status?: string;
    dueDate?: string;
    ownerId?: string;
    title?: string;
    description?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "findings.manage");
  const patch: Record<string, unknown> = {};
  if (input.categoryId) patch.category_id = input.categoryId;
  if (input.status) patch.status = input.status;
  if (input.dueDate) patch.due_date = input.dueDate;
  if (input.ownerId) patch.owner_id = input.ownerId;
  if (input.title) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status === "closed") {
    patch.closed_at = new Date().toISOString();
    patch.closed_by = input.userId;
  }

  const { data, error } = await supabase
    .from("checklist_findings")
    .update(patch)
    .eq("id", input.findingId)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function linkFindingToCapa(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    findingId: string;
    checklistType?: ChecklistType;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "findings.manage");
  const { data: finding } = await supabase
    .from("checklist_findings")
    .select("*")
    .eq("id", input.findingId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!finding) throw new Error("Finding not found");
  if (finding.capa_id) throw new Error("Finding already linked to CAPA");

  const { data: assignment } = await supabase
    .from("checklist_assignments")
    .select("checklist_type")
    .eq("id", finding.assignment_id)
    .maybeSingle();

  const type = (input.checklistType ?? assignment?.checklist_type) as ChecklistType | undefined;
  const sourceModule =
    type === "audit" ? "audit" : type === "compliance" || type === "environmental" ? "compliance" : "inspection";

  const capa = await createCapa(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    sourceModule,
    sourceRecordId: finding.assignment_id,
    title: finding.title,
    description: finding.description ?? undefined,
    dueDate: finding.due_date ?? undefined,
  });

  const { data, error } = await supabase
    .from("checklist_findings")
    .update({ capa_id: capa.id, status: "capa_linked" })
    .eq("id", finding.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function uploadChecklistEvidence(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    assignmentId: string;
    file: File;
    responseId?: string;
    findingId?: string;
  },
) {
  const { validateAttachmentFile } = await import("@/lib/services/attachments");
  const mime = validateAttachmentFile(input.file);
  const safeName =
    input.file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "upload.bin";
  const storagePath = `${input.organizationId}/checklists/${input.assignmentId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("ehs-attachments")
    .upload(storagePath, input.file, { contentType: mime, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("checklist_evidence")
    .insert({
      organization_id: input.organizationId,
      assignment_id: input.assignmentId,
      response_id: input.responseId ?? null,
      finding_id: input.findingId ?? null,
      storage_path: storagePath,
      file_name: safeName,
      content_type: mime,
      file_size: input.file.size,
      uploaded_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getChecklistMetrics(
  supabase: SupabaseClient,
  organizationId: string,
  checklistType?: ChecklistType,
) {
  let q = supabase
    .from("checklist_assignments")
    .select("id, status, score_percent, findings_count, scheduled_for, due_date")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .limit(500);
  if (checklistType) q = q.eq("checklist_type", checklistType);
  const { data } = await q;
  const rows = data ?? [];
  const openStatuses = new Set([
    "scheduled",
    "assigned",
    "planned",
    "in_progress",
    "auditee_notified",
  ]);
  const today = new Date().toISOString().slice(0, 10);
  return {
    total: rows.length,
    open: rows.filter((r) => openStatuses.has(r.status)).length,
    completed: rows.filter((r) =>
      ["completed", "conducted", "approved", "closed", "report_issued"].includes(r.status),
    ).length,
    overdue: rows.filter(
      (r) => r.due_date && r.due_date < today && openStatuses.has(r.status),
    ).length,
    avgScore:
      rows.filter((r) => r.score_percent != null).length === 0
        ? null
        : Math.round(
            (rows
              .filter((r) => r.score_percent != null)
              .reduce((s, r) => s + Number(r.score_percent), 0) /
              rows.filter((r) => r.score_percent != null).length) *
              10,
          ) / 10,
    openFindings: rows.reduce((s, r) => s + (r.findings_count || 0), 0),
  };
}
