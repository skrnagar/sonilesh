"use server";

import { revalidatePath } from "next/cache";
import { requireModuleAccess } from "@/lib/auth/org-context";
import {
  PlanLimitError,
  createBusinessUnit,
  createDepartmentRecord,
  createLocationRecord,
  createProjectRecord,
  createSiteRecord,
  updateBusinessUnit,
  updateProjectRecord,
  updateSiteRecord,
} from "@/lib/services/hierarchy";
import {
  assignMemberRoleScope,
  createOrganizationInvitation,
  updateMemberStatus,
} from "@/lib/services/invitations";
import { writeAuditLog } from "@/lib/services/audit";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/events";
import { sanitizeBranding, sanitizeCurrency, sanitizeLocale, sanitizeTimezone } from "@/lib/branding/validate";

function planLimitResult(err: unknown): ActionResult | null {
  if (err instanceof PlanLimitError) {
    return {
      ok: false,
      error: `${err.message} Upgrade plan or contact sales.`,
    };
  }
  return null;
}

async function requireSettings() {
  return requireModuleAccess({ permission: "settings.manage" });
}

async function requireUsersManage() {
  return requireModuleAccess({ permission: "users.manage" });
}

export async function createBusinessUnitAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireSettings();
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    await createBusinessUnit(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      name: String(formData.get("name") || ""),
      code: String(formData.get("code") || "") || undefined,
      description: String(formData.get("description") || "") || undefined,
    });
    revalidatePath("/app/settings/business-units");
    revalidatePath("/app/settings/organization/structure");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return planLimitResult(err) ?? { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function archiveBusinessUnitAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireSettings();
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    const id = String(formData.get("id") || "");
    const status = String(formData.get("status") || "archived") as
      | "active"
      | "inactive"
      | "archived";
    await updateBusinessUnit(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      id,
      status,
    });
    revalidatePath("/app/settings/business-units");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function createSiteAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireSettings();
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    await createSiteRecord(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      name: String(formData.get("name") || ""),
      code: String(formData.get("code") || "") || undefined,
      businessUnitId: String(formData.get("businessUnitId") || "") || null,
      address: String(formData.get("address") || "") || undefined,
      country: String(formData.get("country") || "") || undefined,
      state: String(formData.get("state") || "") || undefined,
      city: String(formData.get("city") || "") || undefined,
      latitude: formData.get("latitude")
        ? Number(formData.get("latitude"))
        : null,
      longitude: formData.get("longitude")
        ? Number(formData.get("longitude"))
        : null,
      timezone: sanitizeTimezone(String(formData.get("timezone") || "")) || undefined,
      locale: sanitizeLocale(String(formData.get("locale") || "")) || undefined,
      currency: sanitizeCurrency(String(formData.get("currency") || "")) || undefined,
      jurisdictionId: String(formData.get("jurisdictionId") || "") || null,
      siteType:
        String(formData.get("siteType") || "permanent") === "temporary_project"
          ? "temporary_project"
          : "permanent",
      startDate: String(formData.get("startDate") || "") || null,
      endDate: String(formData.get("endDate") || "") || null,
    });
    revalidatePath("/app/settings/sites");
    revalidatePath("/app/settings/organization/structure");
    revalidatePath("/app/admin");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return planLimitResult(err) ?? { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function archiveSiteAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireSettings();
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    const id = String(formData.get("id") || "");
    const status = String(formData.get("status") || "archived");
    await updateSiteRecord(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      id,
      patch: {
        status,
        deleted_at: status === "archived" ? new Date().toISOString() : null,
      },
    });
    revalidatePath("/app/settings/sites");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function createProjectAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireSettings();
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    await createProjectRecord(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      name: String(formData.get("name") || ""),
      code: String(formData.get("code") || "") || undefined,
      businessUnitId: String(formData.get("businessUnitId") || "") || null,
      siteId: String(formData.get("siteId") || "") || null,
      projectType: String(formData.get("projectType") || "") || null,
      clientName: String(formData.get("clientName") || "") || null,
      startDate: String(formData.get("startDate") || "") || null,
      expectedEndDate: String(formData.get("expectedEndDate") || "") || null,
      status: String(formData.get("status") || "planning"),
    });
    revalidatePath("/app/settings/projects");
    revalidatePath("/app/settings/organization/structure");
    revalidatePath("/app/admin");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return planLimitResult(err) ?? { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function updateProjectStatusAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireSettings();
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    await updateProjectRecord(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      id: String(formData.get("id") || ""),
      patch: { status: String(formData.get("status") || "active") },
    });
    revalidatePath("/app/settings/projects");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function createDepartmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireSettings();
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    await createDepartmentRecord(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      name: String(formData.get("name") || ""),
      code: String(formData.get("code") || "") || undefined,
      siteId: String(formData.get("siteId") || "") || null,
      businessUnitId: String(formData.get("businessUnitId") || "") || null,
    });
    revalidatePath("/app/settings/departments");
    revalidatePath("/app/settings/organization/structure");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function createLocationAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireSettings();
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    const siteId = String(formData.get("siteId") || "");
    if (!siteId) return { ok: false, error: "Site is required for locations" };
    await createLocationRecord(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      name: String(formData.get("name") || ""),
      code: String(formData.get("code") || "") || undefined,
      siteId,
      projectId: String(formData.get("projectId") || "") || null,
      parentLocationId: String(formData.get("parentLocationId") || "") || null,
      locationType: String(formData.get("locationType") || "other"),
      description: String(formData.get("description") || "") || null,
    });
    revalidatePath("/app/settings/locations");
    revalidatePath("/app/settings/organization/structure");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function inviteUserAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireUsersManage();
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    const result = await createOrganizationInvitation(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      email: String(formData.get("email") || ""),
      fullName: String(formData.get("fullName") || "") || undefined,
      roleCode: String(formData.get("roleCode") || "employee"),
      scope: String(formData.get("scope") || "organization"),
      businessUnitId: String(formData.get("businessUnitId") || "") || null,
      siteId: String(formData.get("siteId") || "") || null,
      departmentId: String(formData.get("departmentId") || "") || null,
      projectId: String(formData.get("projectId") || "") || null,
    });
    revalidatePath("/app/settings/users");
    revalidatePath("/app/admin");
    return {
      ok: true,
      href: `/app/settings/users/invite?sent=1&token=${encodeURIComponent(result.token)}`,
    };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return planLimitResult(err) ?? { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function updateMemberStatusAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireUsersManage();
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    await updateMemberStatus(access.supabase, {
      organizationId: access.organization.id,
      actorUserId: access.user.id,
      memberId: String(formData.get("memberId") || ""),
      status: String(formData.get("status") || "suspended") as
        | "active"
        | "suspended"
        | "removed",
    });
    revalidatePath("/app/settings/users");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function assignMemberScopeAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireUsersManage();
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    await assignMemberRoleScope(access.supabase, {
      organizationId: access.organization.id,
      actorUserId: access.user.id,
      memberId: String(formData.get("memberId") || ""),
      roleCode: String(formData.get("roleCode") || "employee"),
      scope: String(formData.get("scope") || "organization"),
      siteId: String(formData.get("siteId") || "") || null,
      businessUnitId: String(formData.get("businessUnitId") || "") || null,
      projectId: String(formData.get("projectId") || "") || null,
      departmentId: String(formData.get("departmentId") || "") || null,
    });
    revalidatePath("/app/settings/users");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function updateOrganizationProfileAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const access = await requireSettings();
    if (!access.permitted) return { ok: false, error: "Missing permission" };
    const section = String(formData.get("section") || "general");
    const name = String(formData.get("name") || "").trim();

    const orgPatch: Record<string, unknown> = {
      updated_by: access.user.id,
    };
    if (name) orgPatch.name = name;
    for (const key of [
      "legal_name",
      "industry",
      "company_size",
      "country",
      "state",
      "city",
      "timezone",
      "currency",
      "website",
      "logo_url",
    ] as const) {
      const formKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
      // camelCase form fields: legalName, companySize, etc.
      const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
      void formKey;
      const value = formData.get(camel) ?? formData.get(key);
      if (value !== null && String(value).length) {
        orgPatch[key] = String(value);
      }
    }

    // Explicit camelCase mapping for reliability
    if (formData.get("legalName") != null) orgPatch.legal_name = String(formData.get("legalName") || "") || null;
    if (formData.get("companySize") != null) orgPatch.company_size = String(formData.get("companySize") || "") || null;
    if (formData.get("logoUrl") != null) orgPatch.logo_url = String(formData.get("logoUrl") || "") || null;

    const { data: previous } = await access.supabase
      .from("organizations")
      .select("*")
      .eq("id", access.organization.id)
      .maybeSingle();

    const { error: orgError } = await access.supabase
      .from("organizations")
      .update(orgPatch)
      .eq("id", access.organization.id);
    if (orgError) return { ok: false, error: orgError.message };

    const branding = sanitizeBranding({
      primaryColor: String(formData.get("primaryColor") || "").trim() || null,
      secondaryColor: String(formData.get("secondaryColor") || "").trim() || null,
      logoUrl: String(formData.get("logoUrl") || formData.get("logo_url") || "").trim() || null,
      terminology: {
        capaLabel: String(formData.get("capaLabel") || ""),
        incidentLabel: String(formData.get("incidentLabel") || ""),
        permitLabel: String(formData.get("permitLabel") || ""),
        hazardLabel: String(formData.get("hazardLabel") || ""),
        siteLabel: String(formData.get("siteLabel") || ""),
      },
    });

    const hierarchyConfig = {
      use_business_units: formData.get("useBusinessUnits") === "on",
      use_projects: formData.get("useProjects") === "on",
      use_departments: formData.get("useDepartments") === "on",
      use_locations: formData.get("useLocations") === "on",
    };

    const settingsPatch: Record<string, unknown> = {
      organization_id: access.organization.id,
      updated_at: new Date().toISOString(),
    };

    if (section === "branding" || section === "general") {
      settingsPatch.branding = branding;
    }
    if (section === "regional" || section === "general") {
      settingsPatch.locale = sanitizeLocale(String(formData.get("language") || formData.get("locale") || "en")) ?? "en";
      settingsPatch.date_format = String(formData.get("dateFormat") || "dd/MM/yyyy");
      settingsPatch.time_format = String(formData.get("timeFormat") || "24h");
      settingsPatch.language = sanitizeLocale(String(formData.get("language") || "en")) ?? "en";
      const jurisdictionId = String(formData.get("jurisdictionId") || "");
      settingsPatch.default_jurisdiction_id = jurisdictionId || null;
    }
    if (section === "hierarchy") {
      settingsPatch.hierarchy_config = hierarchyConfig;
    }
    if (section === "ehs") {
      settingsPatch.risk_matrix = {
        enabled: formData.get("riskMatrixEnabled") === "on",
        notes: String(formData.get("ehsNotes") || ""),
      };
      settingsPatch.allow_anonymous_reporting = formData.get("allowAnonymous") === "on";
    }
    if (section === "notifications") {
      settingsPatch.notification_config = {
        email_digests: formData.get("emailDigests") === "on",
        incident_alerts: formData.get("incidentAlerts") === "on",
      };
    }
    if (section === "security") {
      settingsPatch.security_config = {
        require_mfa_admins: formData.get("requireMfaAdmins") === "on",
        session_timeout_minutes: Number(formData.get("sessionTimeout") || 480),
      };
    }

    const { error: settingsError } = await access.supabase
      .from("organization_settings")
      .upsert(settingsPatch, { onConflict: "organization_id" });
    if (settingsError) return { ok: false, error: settingsError.message };

    await writeAuditLog(access.supabase, {
      organizationId: access.organization.id,
      actorUserId: access.user.id,
      action:
        section === "branding"
          ? "organization.branding_changed"
          : "organization.settings_changed",
      entityType: "organization_settings",
      entityId: access.organization.id,
      previousValues: previous,
      newValues: { section, orgPatch, settingsPatch },
    });

    revalidatePath("/app/settings/organization");
    revalidatePath("/app/settings");
    revalidatePath("/app");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}
