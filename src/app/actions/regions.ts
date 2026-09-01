"use server";

import { revalidatePath } from "next/cache";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { createRegionRecord, updateRegionRecord } from "@/lib/services/hierarchy";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/events";

async function requireSettings() {
  return requireModuleAccess({ permission: "settings.manage" });
}

export async function createRegionAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireSettings();
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    const businessUnitId = String(formData.get("businessUnitId") || "") || undefined;
    await createRegionRecord(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      name: String(formData.get("name") || ""),
      code: String(formData.get("code") || "") || undefined,
      description: String(formData.get("description") || "") || undefined,
      businessUnitId: businessUnitId ?? null,
    });
    revalidatePath("/app/settings/regions");
    revalidatePath("/app/settings/organization/structure");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function archiveRegionAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireSettings();
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    const id = String(formData.get("id") || "");
    const status = String(formData.get("status") || "archived");
    await updateRegionRecord(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      id,
      patch: {
        status,
        deleted_at: status === "archived" ? new Date().toISOString() : null,
      },
    });
    revalidatePath("/app/settings/regions");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}
