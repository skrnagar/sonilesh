"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgAdminAccess } from "@/lib/auth/org-admin";
import { sanitizeBranding, sanitizeCustomDomain } from "@/lib/branding/validate";
import { writeAuditLog } from "@/lib/services/audit";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/events";

import { ORG_ADMIN_PATHS } from "@/lib/navigation/org-admin";

function revalidateOrgAdmin() {
  for (const path of ORG_ADMIN_PATHS) revalidatePath(path);
  revalidatePath("/org-admin");
}

export async function updateOrgGeneralAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireOrgAdminAccess();
    if (!access.permitted) return { ok: false, error: "Missing permission" };

    const name = String(formData.get("name") || "").trim();
    if (!name) return { ok: false, error: "Organization name is required" };

    const customDomain = sanitizeCustomDomain(String(formData.get("customDomain") || ""));

    const orgPatch: Record<string, unknown> = {
      name,
      updated_by: access.user.id,
      custom_domain: customDomain,
    };

    for (const [formKey, col] of [
      ["legalName", "legal_name"],
      ["industry", "industry"],
      ["companySize", "company_size"],
      ["website", "website"],
      ["country", "country"],
      ["state", "state"],
      ["city", "city"],
    ] as const) {
      const value = formData.get(formKey);
      if (value !== null) {
        orgPatch[col] = String(value).trim() || null;
      }
    }

    const slug = String(formData.get("slug") || "").trim().toLowerCase();
    if (slug) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return { ok: false, error: "Slug must be lowercase letters, numbers, and hyphens" };
      }
      orgPatch.slug = slug;
    }

    const { data: previous } = await access.supabase
      .from("organizations")
      .select("*")
      .eq("id", access.organization.id)
      .maybeSingle();

    const { error } = await access.supabase
      .from("organizations")
      .update(orgPatch)
      .eq("id", access.organization.id);
    if (error) return { ok: false, error: error.message };

    await writeAuditLog(access.supabase, {
      organizationId: access.organization.id,
      actorUserId: access.user.id,
      action: "organization.profile_updated",
      entityType: "organization",
      entityId: access.organization.id,
      previousValues: previous,
      newValues: orgPatch,
    });

    revalidateOrgAdmin();
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function updateOrgBrandingAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireOrgAdminAccess();
    if (!access.permitted) return { ok: false, error: "Missing permission" };

    const branding = sanitizeBranding({
      primaryColor: String(formData.get("primaryColor") || "").trim() || null,
      secondaryColor: String(formData.get("secondaryColor") || "").trim() || null,
      logoUrl: String(formData.get("logoUrl") || "").trim() || null,
      terminology: {
        capaLabel: String(formData.get("capaLabel") || ""),
        incidentLabel: String(formData.get("incidentLabel") || ""),
      },
    });

    const logoUrl = branding.logoUrl;

    const { error: orgError } = await access.supabase
      .from("organizations")
      .update({
        logo_url: logoUrl,
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
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id" },
      );
    if (settingsError) return { ok: false, error: settingsError.message };

    await writeAuditLog(access.supabase, {
      organizationId: access.organization.id,
      actorUserId: access.user.id,
      action: "organization.branding_changed",
      entityType: "organization_settings",
      entityId: access.organization.id,
      newValues: { branding },
    });

    revalidateOrgAdmin();
    revalidatePath("/app");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function updateFilePolicyAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireOrgAdminAccess();
    if (!access.permitted) return { ok: false, error: "Missing permission" };

    const uploadRoles = formData
      .getAll("uploadRoles")
      .map((v) => String(v).trim())
      .filter(Boolean);

    const retentionNote = String(formData.get("retentionNote") || "").trim().slice(0, 500);

    const { data: existing } = await access.supabase
      .from("organization_settings")
      .select("settings")
      .eq("organization_id", access.organization.id)
      .maybeSingle();

    const settings = (existing?.settings ?? {}) as Record<string, unknown>;
    const filePolicy = {
      upload_roles: uploadRoles.length ? uploadRoles : ["tenant_admin", "ehs_manager", "ehs_officer"],
      retention_note: retentionNote || null,
    };

    const { error } = await access.supabase
      .from("organization_settings")
      .upsert(
        {
          organization_id: access.organization.id,
          settings: { ...settings, file_policy: filePolicy },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id" },
      );
    if (error) return { ok: false, error: error.message };

    await writeAuditLog(access.supabase, {
      organizationId: access.organization.id,
      actorUserId: access.user.id,
      action: "organization.file_policy_changed",
      entityType: "organization_settings",
      entityId: access.organization.id,
      newValues: { file_policy: filePolicy },
    });

    revalidateOrgAdmin();
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function requestDataExportAction(): Promise<void> {
  const access = await requireOrgAdminAccess();
  if (!access.permitted) throw new Error("Missing permission");

  await writeAuditLog(access.supabase, {
    organizationId: access.organization.id,
    actorUserId: access.user.id,
    action: "organization.data_export_requested",
    entityType: "organization",
    entityId: access.organization.id,
    newValues: { status: "pending", note: "Placeholder — export pipeline not yet implemented" },
  });

  redirect("/org-admin/data?exported=1");
}
