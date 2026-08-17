"use server";

import { revalidatePath } from "next/cache";
import { requireModuleAccess } from "@/lib/auth/org-context";
import {
  archiveCustomFieldDefinition,
  upsertCustomFieldDefinition,
} from "@/lib/services/attachments";
import { writeAuditLog } from "@/lib/services/audit";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/events";
import type { CustomFieldType } from "@/lib/reporting/types";

export async function upsertCategoryAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({ permission: "settings.manage" });
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    const eventTypeId = String(formData.get("eventTypeId") || "");
    const code = String(formData.get("code") || "").trim().toLowerCase().replace(/\s+/g, "_");
    const name = String(formData.get("name") || "").trim();
    if (!eventTypeId || !code || !name) return { ok: false, error: "All fields required" };

    const { error } = await access.supabase.from("event_categories").upsert(
      {
        organization_id: access.organization.id,
        event_type_id: eventTypeId,
        code,
        name,
        is_active: true,
      },
      { onConflict: "organization_id,event_type_id,code" },
    );
    if (error) return { ok: false, error: error.message };
    revalidatePath("/app/settings/ehs/categories");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function archiveCategoryAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({ permission: "settings.manage" });
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    const id = String(formData.get("id") || "");
    const { count } = await access.supabase
      .from("ehs_events")
      .select("id", { count: "exact", head: true })
      .eq("event_category_id", id)
      .eq("organization_id", access.organization.id);
    if ((count ?? 0) > 0) {
      await access.supabase
        .from("event_categories")
        .update({ is_active: false })
        .eq("id", id)
        .eq("organization_id", access.organization.id);
    } else {
      await access.supabase
        .from("event_categories")
        .update({ is_active: false })
        .eq("id", id)
        .eq("organization_id", access.organization.id);
    }
    revalidatePath("/app/settings/ehs/categories");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function upsertSeverityAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({ permission: "settings.manage" });
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    const code = String(formData.get("code") || "").trim().toLowerCase();
    const name = String(formData.get("name") || "").trim();
    const rank = Number(formData.get("rank") || 1);
    const { error } = await access.supabase.from("severity_levels").upsert(
      {
        organization_id: access.organization.id,
        code,
        name,
        rank,
        score: Number(formData.get("score") || rank * 25),
        sort_order: rank,
        color: String(formData.get("color") || "") || null,
        description: String(formData.get("description") || "") || null,
        requires_investigation: formData.get("requiresInvestigation") === "on",
        is_active: true,
      },
      { onConflict: "organization_id,code" },
    );
    // unique index is partial — fallback insert
    if (error) {
      const { error: insertError } = await access.supabase.from("severity_levels").insert({
        organization_id: access.organization.id,
        code,
        name,
        rank,
        score: Number(formData.get("score") || rank * 25),
        sort_order: rank,
        color: String(formData.get("color") || "") || null,
        description: String(formData.get("description") || "") || null,
        requires_investigation: formData.get("requiresInvestigation") === "on",
        is_active: true,
      });
      if (insertError) return { ok: false, error: insertError.message };
    }
    await writeAuditLog(access.supabase, {
      organizationId: access.organization.id,
      actorUserId: access.user.id,
      action: "report.severity_updated",
      entityType: "severity_level",
      newValues: { code, name, rank },
    });
    revalidatePath("/app/settings/ehs/severities");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function upsertCustomFieldAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({ permission: "settings.manage" });
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    await upsertCustomFieldDefinition(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      eventTypeId: String(formData.get("eventTypeId") || ""),
      code: String(formData.get("code") || ""),
      label: String(formData.get("label") || ""),
      fieldType: String(formData.get("fieldType") || "text") as CustomFieldType,
      required: formData.get("required") === "on",
      helpText: String(formData.get("helpText") || "") || undefined,
    });
    revalidatePath("/app/settings/ehs/report-types");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function archiveCustomFieldAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({ permission: "settings.manage" });
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    await archiveCustomFieldDefinition(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      id: String(formData.get("id") || ""),
    });
    revalidatePath("/app/settings/ehs/report-types");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function seedCategoriesAction(): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({ permission: "settings.manage" });
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    const { error } = await access.supabase.rpc("seed_org_report_categories", {
      p_organization_id: access.organization.id,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/app/settings/ehs/categories");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}
