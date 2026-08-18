"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/auth/org-context";
import {
  addSectionWithQuestions,
  completeAssignment,
  createAssignment,
  createChecklistTemplate,
  ensureDefaultTemplates,
  linkFindingToCapa,
  recordResponse,
  transitionAssignment,
  updateFinding,
  uploadChecklistEvidence,
  type ChecklistType,
  type QuestionType,
} from "@/lib/services/checklists";
import { collectFiles } from "@/lib/services/attachments";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/events";

function failed(err: unknown): ActionResult {
  return { ok: false, error: formatSupabaseUserError(err) };
}

function revalidateChecklist(type: string, id?: string) {
  revalidatePath("/app/inspections");
  revalidatePath("/app/audits");
  revalidatePath("/app/findings");
  revalidatePath("/app/settings/ehs/checklists");
  revalidatePath("/field/inspection");
  if (id) {
    revalidatePath(`/app/inspections/${id}`);
    revalidatePath(`/app/audits/${id}`);
  }
  if (type === "audit") revalidatePath("/app/audits");
}

export async function seedChecklistTemplatesAction(formData: FormData): Promise<ActionResult> {
  try {
    void formData;
    const { supabase, user, organization } = await requireOrgContext();
    await ensureDefaultTemplates(
      supabase,
      organization.id,
      user.id,
    );
    revalidateChecklist("inspection");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function createTemplateAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const checklistType = String(formData.get("checklistType") || "inspection") as ChecklistType;
    const row = await createChecklistTemplate(supabase, {
      organizationId: organization.id,
      userId: user.id,
      code: String(formData.get("code") || "").trim(),
      name: String(formData.get("name") || "").trim(),
      checklistType,
      autoCapaOnFail: formData.get("autoCapaOnFail") === "on",
      description: String(formData.get("description") || "") || undefined,
    });
    const sectionTitle = String(formData.get("sectionTitle") || "General");
    const prompts = String(formData.get("questions") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (prompts.length) {
      await addSectionWithQuestions(supabase, {
        organizationId: organization.id,
        templateId: row.id,
        title: sectionTitle,
        questions: prompts.map((prompt) => ({
          prompt,
          questionType: "pass_fail" as QuestionType,
          options: [
            { label: "Pass", value: "pass", score: 1 },
            { label: "Fail", value: "fail", score: 0, isFailing: true },
            { label: "N/A", value: "na", score: 0 },
          ],
        })),
      });
    }
    revalidateChecklist(checklistType);
    return { ok: true, id: row.id };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function createAssignmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const checklistType = String(formData.get("checklistType") || "inspection") as ChecklistType;
    const row = await createAssignment(supabase, {
      organizationId: organization.id,
      userId: user.id,
      templateId: String(formData.get("templateId") || ""),
      title: String(formData.get("title") || "").trim(),
      checklistType,
      siteId: String(formData.get("siteId") || "") || undefined,
      projectId: String(formData.get("projectId") || "") || undefined,
      assigneeId: String(formData.get("assigneeId") || "") || undefined,
      scheduledFor: String(formData.get("scheduledFor") || "") || undefined,
      dueDate: String(formData.get("dueDate") || "") || undefined,
      description: String(formData.get("description") || "") || undefined,
      priority: String(formData.get("priority") || "normal") || undefined,
    });
    const href =
      checklistType === "audit" ? `/app/audits/${row.id}` : `/app/inspections/${row.id}`;
    revalidateChecklist(checklistType, row.id);
    return { ok: true, id: row.id, href };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function saveResponseAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const assignmentId = String(formData.get("assignmentId") || "");
    const value = String(formData.get("value") || "");
    const isNa = value === "na";
    const isFailing = value === "fail" || value === "no";
    await recordResponse(supabase, {
      organizationId: organization.id,
      userId: user.id,
      assignmentId,
      questionId: String(formData.get("questionId") || ""),
      valueText: value,
      isNa,
      isFailing,
      comment: String(formData.get("comment") || "") || undefined,
      score: isNa ? 0 : isFailing ? 0 : 1,
      autoCapa: formData.get("autoCapa") === "1" && isFailing,
      findingTitle: isFailing ? String(formData.get("findingTitle") || "Checklist fail") : undefined,
      checklistType: String(formData.get("checklistType") || "inspection") as ChecklistType,
    });
    revalidateChecklist(String(formData.get("checklistType") || "inspection"), assignmentId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function completeAssignmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const assignmentId = String(formData.get("assignmentId") || "");
    await completeAssignment(supabase, {
      organizationId: organization.id,
      userId: user.id,
      assignmentId,
      reportNotes: String(formData.get("reportNotes") || "") || undefined,
    });
    revalidateChecklist(String(formData.get("checklistType") || "inspection"), assignmentId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function transitionAssignmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const assignmentId = String(formData.get("assignmentId") || "");
    await transitionAssignment(supabase, {
      organizationId: organization.id,
      userId: user.id,
      assignmentId,
      toStatus: String(formData.get("toStatus") || ""),
      reportNotes: String(formData.get("reportNotes") || "") || undefined,
    });
    revalidateChecklist(String(formData.get("checklistType") || "inspection"), assignmentId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function updateFindingAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    await updateFinding(supabase, {
      organizationId: organization.id,
      userId: user.id,
      findingId: String(formData.get("findingId") || ""),
      categoryId: String(formData.get("categoryId") || "") || undefined,
      status: String(formData.get("status") || "") || undefined,
      dueDate: String(formData.get("dueDate") || "") || undefined,
    });
    revalidatePath("/app/findings");
    const assignmentId = String(formData.get("assignmentId") || "");
    if (assignmentId) revalidateChecklist("inspection", assignmentId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function linkFindingCapaAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    await linkFindingToCapa(supabase, {
      organizationId: organization.id,
      userId: user.id,
      findingId: String(formData.get("findingId") || ""),
      checklistType: String(formData.get("checklistType") || "") as ChecklistType | undefined,
    });
    revalidatePath("/app/findings");
    revalidatePath("/app/capa");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function uploadChecklistEvidenceAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const assignmentId = String(formData.get("assignmentId") || "");
    const files = collectFiles(formData);
    if (!files.length) return { ok: false, error: "Select at least one file" };
    for (const file of files) {
      await uploadChecklistEvidence(supabase, {
        organizationId: organization.id,
        userId: user.id,
        assignmentId,
        file,
      });
    }
    revalidateChecklist(String(formData.get("checklistType") || "inspection"), assignmentId);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}
