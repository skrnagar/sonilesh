"use server";

import { revalidatePath } from "next/cache";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { writeAuditLog } from "@/lib/services/audit";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";

export type SettingsResult = { ok: true } | { ok: false; error: string };

export async function updateOrganizationSettingsAction(
  formData: FormData,
): Promise<SettingsResult> {
  try {
    const access = await requireModuleAccess({ permission: "settings.manage" });
    if (!access.permitted) return { ok: false, error: "Missing permission: settings.manage" };

    const name = String(formData.get("name") || "").trim();
    if (name.length < 2) return { ok: false, error: "Company name is required" };

    const branding = {
      primaryColor: String(formData.get("primaryColor") || "").trim() || null,
      logoUrl: String(formData.get("logoUrl") || "").trim() || null,
    };
    const terminology = {
      hazardLabel: String(formData.get("hazardLabel") || "LMRA").trim() || "LMRA",
    };

    const { error: orgError } = await access.supabase
      .from("organizations")
      .update({
        name,
        industry: String(formData.get("industry") || "") || null,
        timezone: String(formData.get("timezone") || "Asia/Kolkata"),
        updated_by: access.user.id,
      })
      .eq("id", access.organization.id);
    if (orgError) return { ok: false, error: orgError.message };

    const { error: settingsError } = await access.supabase
      .from("organization_settings")
      .upsert(
        {
          organization_id: access.organization.id,
          branding,
          terminology,
          locale: String(formData.get("locale") || "en"),
          date_format: String(formData.get("dateFormat") || "yyyy-MM-dd"),
          allow_anonymous_reporting: formData.get("allowAnonymous") === "on",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id" },
      );
    if (settingsError) return { ok: false, error: settingsError.message };

    await writeAuditLog(access.supabase, {
      organizationId: access.organization.id,
      actorUserId: access.user.id,
      action: "organization.settings_updated",
      entityType: "organization_settings",
      entityId: access.organization.id,
      newValues: { name, branding, terminology },
    });

    revalidatePath("/app/settings");
    revalidatePath("/app");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}
