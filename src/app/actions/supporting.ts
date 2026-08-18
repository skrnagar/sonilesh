"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/auth/org-context";
import {
  createContractor,
  createTrainingCourse,
  assignTraining,
} from "@/lib/services/supporting";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/events";

function failed(err: unknown): ActionResult {
  return { ok: false, error: formatSupabaseUserError(err) };
}

export async function createTrainingCourseAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user, organization, supabase } = await requireWriteAccess({
      permission: "training.manage",
    });
    const code = String(formData.get("code") || "").trim();
    const title = String(formData.get("title") || "").trim();
    if (!code || !title) return { ok: false, error: "Course code and title are required" };
    await createTrainingCourse(supabase, {
      organizationId: organization.id,
      userId: user.id,
      code,
      title,
      validityDays: Number(formData.get("validityDays") || 0) || undefined,
    });
    revalidatePath("/app/training");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function assignTrainingAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user, organization, supabase } = await requireWriteAccess({
      permission: "training.manage",
    });
    const courseId = String(formData.get("courseId") || "");
    const assigneeId = String(formData.get("assigneeId") || user.id);
    if (!courseId) return { ok: false, error: "Select a course" };
    await assignTraining(supabase, {
      organizationId: organization.id,
      userId: user.id,
      courseId,
      assigneeId,
      dueDate: String(formData.get("dueDate") || "") || undefined,
    });
    revalidatePath("/app/training");
    revalidatePath("/field/training");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function createContractorAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user, organization, supabase } = await requireWriteAccess({
      featureCode: "contractor_management",
      permission: "contractor.create",
    });
    const name = String(formData.get("name") || "").trim();
    if (!name) return { ok: false, error: "Company name is required" };
    await createContractor(supabase, {
      organizationId: organization.id,
      userId: user.id,
      name,
    });
    revalidatePath("/app/contractors");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}
