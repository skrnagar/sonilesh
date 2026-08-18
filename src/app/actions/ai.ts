"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/auth/org-context";
import { userHasPermission } from "@/lib/services/rbac";
import { decideSuggestion } from "@/lib/ai/suggestions";
import { formatSupabaseUserError } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/events";

export async function decideAiSuggestionAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization, profile } = await requireOrgContext();
    const suggestionId = String(formData.get("suggestionId") || "");
    const decision = String(formData.get("decision") || "") as "approved" | "rejected" | "edited";
    if (!suggestionId || !["approved", "rejected", "edited"].includes(decision)) {
      return { ok: false, error: "Invalid suggestion decision." };
    }
    const hasApprove = profile?.is_platform_admin
      ? true
      : await userHasPermission(supabase, organization.id, user.id, "ai.approve");
    await decideSuggestion(supabase, {
      organizationId: organization.id,
      userId: user.id,
      suggestionId,
      decision,
      note: String(formData.get("note") || "") || undefined,
      actorType: "human",
      hasApprovePermission: hasApprove,
    });
    revalidatePath("/app/ai/actions");
    revalidatePath("/app/capa");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}
