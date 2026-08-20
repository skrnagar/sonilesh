"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { requireUser } from "@/lib/auth/session";
import {
  completeOnboarding,
  createOrganizationWithOwner,
} from "@/lib/services/organization";
import {
  createBusinessUnit,
  createDepartmentRecord,
  createProjectRecord,
  createSiteRecord,
  PlanLimitError,
} from "@/lib/services/hierarchy";
import { createOrganizationInvitation } from "@/lib/services/invitations";
import { sanitizeBranding } from "@/lib/branding/validate";
import {
  advanceOnboardingStep,
  ensureOnboardingProgress,
  onboardingPathForStep,
} from "@/lib/services/onboarding-progress";
import { DEFAULT_PROJECT_TYPES } from "@/lib/constants/organization";
import {
  formatSupabaseUserError,
  isNextRedirect,
  isSchemaMissingError,
  setupRedirectPath,
} from "@/lib/supabase/errors";

async function requireOrgMembership(
  organizationId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
) {
  const { data } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (!data) throw new Error("Organization access required");
}

function onboardingError(orgId: string, step: string, err: unknown): never {
  if (isNextRedirect(err)) throw err;
  if (isSchemaMissingError(err)) redirect(setupRedirectPath(err));
  const message =
    err instanceof PlanLimitError
      ? err.message
      : formatSupabaseUserError(err);
  const path = onboardingPathForStep(step, orgId);
  const joiner = path.includes("?") ? "&" : "?";
  redirect(`${path}${joiner}error=${encodeURIComponent(message)}`);
}

export async function createOrganizationAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const parsed = z
    .object({
      name: z.string().min(2),
      industry: z.string().min(2),
      companyType: z.string().optional(),
      country: z.string().optional(),
      legalName: z.string().optional(),
      companySize: z.string().optional(),
    })
    .safeParse({
      name: formData.get("name"),
      industry: formData.get("industry"),
      companyType: formData.get("companyType") || undefined,
      country: formData.get("country") || undefined,
      legalName: formData.get("legalName") || undefined,
      companySize: formData.get("companySize") || undefined,
    });
  if (!parsed.success) {
    redirect(
      `/onboarding?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid")}`,
    );
  }

  try {
    const org = await createOrganizationWithOwner(supabase, {
      userId: user.id,
      name: parsed.data.name,
      industry: parsed.data.industry,
      companyType: parsed.data.companyType,
      country: parsed.data.country,
    });

    await supabase
      .from("organizations")
      .update({
        legal_name: parsed.data.legalName ?? null,
        company_size: parsed.data.companySize ?? null,
        updated_by: user.id,
      })
      .eq("id", org.id);

    await ensureOnboardingProgress(supabase, org.id, user.id);
    await advanceOnboardingStep(supabase, {
      organizationId: org.id,
      userId: user.id,
      step: "welcome",
    });
    await advanceOnboardingStep(supabase, {
      organizationId: org.id,
      userId: user.id,
      step: "company",
      stepData: { company: parsed.data },
      nextStep: "industry",
    });
    redirect(`/onboarding/industry?org=${org.id}`);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    if (isSchemaMissingError(err)) redirect(setupRedirectPath(err));
    redirect(`/onboarding?error=${encodeURIComponent(formatSupabaseUserError(err))}`);
  }
}

export async function saveIndustryStepAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const organizationId = String(formData.get("organizationId") || "");
  const industry = String(formData.get("industry") || "");
  const otherIndustry = String(formData.get("otherIndustry") || "");
  try {
    await requireOrgMembership(organizationId, user.id, supabase);
    const value = industry === "Other" && otherIndustry ? otherIndustry : industry;
    await supabase
      .from("organizations")
      .update({ industry: value, updated_by: user.id })
      .eq("id", organizationId);
    await advanceOnboardingStep(supabase, {
      organizationId,
      userId: user.id,
      step: "industry",
      stepData: { industry: value },
    });
    redirect(`/onboarding/structure?org=${organizationId}`);
  } catch (err) {
    onboardingError(organizationId, "industry", err);
  }
}

export async function saveStructureStepAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const organizationId = String(formData.get("organizationId") || "");
  const skip = formData.get("skip") === "1";
  try {
    await requireOrgMembership(organizationId, user.id, supabase);
    const hierarchy_config = {
      use_business_units: formData.get("useBusinessUnits") === "on",
      use_projects: formData.get("useProjects") === "on",
      use_departments: formData.get("useDepartments") === "on",
      use_locations: formData.get("useLocations") === "on",
    };
    if (!skip) {
      await supabase.from("organization_settings").upsert(
        {
          organization_id: organizationId,
          hierarchy_config,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id" },
      );
    }
    const next = hierarchy_config.use_business_units ? "business_unit" : "site";
    await advanceOnboardingStep(supabase, {
      organizationId,
      userId: user.id,
      step: "structure",
      skip,
      stepData: { hierarchy_config },
      nextStep: next,
    });
    redirect(`/onboarding/${next}?org=${organizationId}`);
  } catch (err) {
    onboardingError(organizationId, "structure", err);
  }
}

export async function saveBusinessUnitStepAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const organizationId = String(formData.get("organizationId") || "");
  const skip = formData.get("skip") === "1";
  try {
    await requireOrgMembership(organizationId, user.id, supabase);
    if (!skip) {
      await createBusinessUnit(supabase, {
        organizationId,
        userId: user.id,
        name: String(formData.get("name") || ""),
        code: String(formData.get("code") || "") || undefined,
        description: String(formData.get("description") || "") || undefined,
      });
    }
    await advanceOnboardingStep(supabase, {
      organizationId,
      userId: user.id,
      step: "business_unit",
      skip,
    });
    redirect(`/onboarding/site?org=${organizationId}`);
  } catch (err) {
    onboardingError(organizationId, "business_unit", err);
  }
}

export async function createFirstSiteAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const organizationId = String(formData.get("organizationId") || "");
  const skip = formData.get("skip") === "1";
  try {
    await requireOrgMembership(organizationId, user.id, supabase);
    if (!skip) {
      await createSiteRecord(supabase, {
        organizationId,
        userId: user.id,
        name: String(formData.get("name") || ""),
        code: String(formData.get("code") || "") || undefined,
        city: String(formData.get("city") || "") || undefined,
        country: String(formData.get("country") || "") || undefined,
        siteType:
          String(formData.get("siteType") || "permanent") === "temporary_project"
            ? "temporary_project"
            : "permanent",
      });
    }
    const { data: settings } = await supabase
      .from("organization_settings")
      .select("hierarchy_config")
      .eq("organization_id", organizationId)
      .maybeSingle();
    const useProjects =
      ((settings?.hierarchy_config as { use_projects?: boolean } | null)
        ?.use_projects ?? true) !== false;
    const next = useProjects ? "project" : "invite";
    await advanceOnboardingStep(supabase, {
      organizationId,
      userId: user.id,
      step: "site",
      skip,
      nextStep: next,
    });
    redirect(`/onboarding/${next}?org=${organizationId}`);
  } catch (err) {
    onboardingError(organizationId, "site", err);
  }
}

export async function saveProjectStepAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const organizationId = String(formData.get("organizationId") || "");
  const skip = formData.get("skip") === "1";
  try {
    await requireOrgMembership(organizationId, user.id, supabase);
    if (!skip) {
      const { data: site } = await supabase
        .from("sites")
        .select("id")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      await createProjectRecord(supabase, {
        organizationId,
        userId: user.id,
        name: String(formData.get("name") || ""),
        code: String(formData.get("code") || "") || undefined,
        siteId: site?.id ?? null,
        projectType:
          String(formData.get("projectType") || "") ||
          DEFAULT_PROJECT_TYPES[0].code,
        status: "planning",
      });
    }
    await advanceOnboardingStep(supabase, {
      organizationId,
      userId: user.id,
      step: "project",
      skip,
    });
    redirect(`/onboarding/invite?org=${organizationId}`);
  } catch (err) {
    onboardingError(organizationId, "project", err);
  }
}

export async function inviteUsersAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const organizationId = String(formData.get("organizationId") || "");
  const skip = formData.get("skip") === "1";
  try {
    await requireOrgMembership(organizationId, user.id, supabase);
    const access = await requireModuleAccess({ permission: "users.manage" });
    if (!access.permitted || access.organization.id !== organizationId) {
      throw new Error("Missing permission: users.manage");
    }
    if (!skip) {
      const emails = String(formData.get("emails") || "")
        .split(/[\n,;]+/)
        .map((e) => e.trim())
        .filter(Boolean);
      const roleCode = String(formData.get("roleCode") || "ehs_officer");
      for (const email of emails) {
        await createOrganizationInvitation(supabase, {
          organizationId,
          userId: user.id,
          email,
          roleCode,
          scope: "organization",
        });
      }
    }
    await advanceOnboardingStep(supabase, {
      organizationId,
      userId: user.id,
      step: "invite",
      skip,
    });
    redirect(`/onboarding/ehs_config?org=${organizationId}`);
  } catch (err) {
    onboardingError(organizationId, "invite", err);
  }
}

export async function saveEhsConfigStepAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const organizationId = String(formData.get("organizationId") || "");
  const skip = formData.get("skip") === "1";
  try {
    await requireOrgMembership(organizationId, user.id, supabase);
    if (!skip) {
      await supabase.from("organization_settings").upsert(
        {
          organization_id: organizationId,
          allow_anonymous_reporting: formData.get("allowAnonymous") === "on",
          risk_matrix: {
            enabled: true,
            scale: 5,
            notes: String(formData.get("ehsNotes") || ""),
          },
          branding: sanitizeBranding({
            primaryColor: String(formData.get("primaryColor") || "") || null,
          }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id" },
      );
      const seedDepts = formData.get("seedDepartments") === "on";
      if (seedDepts) {
        const { data: site } = await supabase
          .from("sites")
          .select("id")
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .limit(1)
          .maybeSingle();
        for (const name of ["EHS", "Operations"]) {
          await createDepartmentRecord(supabase, {
            organizationId,
            userId: user.id,
            name,
            siteId: site?.id ?? null,
          });
        }
      }
    }
    await advanceOnboardingStep(supabase, {
      organizationId,
      userId: user.id,
      step: "ehs_config",
      skip,
    });
    redirect(`/onboarding/review?org=${organizationId}`);
  } catch (err) {
    onboardingError(organizationId, "ehs_config", err);
  }
}

export async function finishOnboardingAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const organizationId = String(formData.get("organizationId") || "");
  const planId = String(formData.get("planId") || "");
  try {
    await requireOrgMembership(organizationId, user.id, supabase);
    if (planId) {
      const { data: current } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .maybeSingle();
      if (current) {
        await supabase
          .from("subscriptions")
          .update({ plan_id: planId, updated_by: user.id })
          .eq("id", current.id);
      }
    }
    await advanceOnboardingStep(supabase, {
      organizationId,
      userId: user.id,
      step: "review",
      nextStep: "finish",
    });
    await completeOnboarding(supabase, organizationId, user.id);
    await advanceOnboardingStep(supabase, {
      organizationId,
      userId: user.id,
      step: "finish",
      nextStep: "finish",
    });
    redirect("/app/dashboard");
  } catch (err) {
    onboardingError(organizationId, "review", err);
  }
}

/** Legacy alias used by older plan page */
export async function selectPlanAction(formData: FormData): Promise<void> {
  return finishOnboardingAction(formData);
}
