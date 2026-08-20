"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformPermission } from "@/lib/auth/session";
import {
  applySubscriptionDiscount,
  archivePlan,
  cancelSubscriptionAdmin,
  changeOrganizationPlan,
  createCatalogFeature,
  createOrganizationAdmin,
  createPlan,
  duplicatePlan,
  removeFeatureOverride,
  updateOrganizationStatus,
  upsertFeatureOverride,
  upsertPlanFeatureCell,
} from "@/lib/services/admin";
import { writeAuditLog } from "@/lib/services/audit";

export async function adminUpdateOrgStatusAction(formData: FormData) {
  const { supabase, user } = await requirePlatformPermission("saas.organizations.suspend");
  await updateOrganizationStatus(supabase, {
    userId: user.id,
    organizationId: String(formData.get("organizationId") || ""),
    status: String(formData.get("status") || ""),
    reason: String(formData.get("reason") || "") || undefined,
  });
  revalidatePath("/admin/organizations");
}

export async function adminChangePlanAction(formData: FormData) {
  const { supabase, user } = await requirePlatformPermission("saas.subscriptions.manage");
  const customMonthly = formData.get("customPriceMonthlyCents");
  const extendTrial = formData.get("extendTrialDays");
  const organizationId = String(formData.get("organizationId") || "");
  await changeOrganizationPlan(supabase, {
    userId: user.id,
    organizationId,
    planId: String(formData.get("planId") || ""),
    customPriceMonthlyCents: customMonthly ? Number(customMonthly) : null,
    extendTrialDays: extendTrial ? Number(extendTrial) : undefined,
  });
  revalidatePath(`/admin/organizations/${organizationId}`);
  revalidatePath("/admin/subscriptions");
}

export async function adminFeatureOverrideAction(formData: FormData) {
  const { supabase, user } = await requirePlatformPermission("saas.entitlements.override");
  const organizationId = String(formData.get("organizationId") || "");
  await upsertFeatureOverride(supabase, {
    userId: user.id,
    organizationId,
    featureId: String(formData.get("featureId") || ""),
    enabled: formData.get("enabled") === "true",
    limitValue: formData.get("limitValue") ? Number(formData.get("limitValue")) : null,
    unlimited: formData.get("unlimited") === "true",
    isTemporary: formData.get("isTemporary") === "true",
    startsAt: String(formData.get("startsAt") || "") || null,
    endsAt: String(formData.get("endsAt") || "") || null,
    reason: String(formData.get("reason") || "") || undefined,
  });
  revalidatePath(`/admin/organizations/${organizationId}`);
}

export async function adminRemoveOverrideAction(formData: FormData) {
  const { supabase, user } = await requirePlatformPermission("saas.entitlements.override");
  const organizationId = String(formData.get("organizationId") || "");
  await removeFeatureOverride(supabase, {
    userId: user.id,
    organizationId,
    overrideId: String(formData.get("overrideId") || ""),
    reason: String(formData.get("reason") || "") || undefined,
  });
  revalidatePath(`/admin/organizations/${organizationId}`);
}

export async function adminCreateOrganizationAction(formData: FormData) {
  const { supabase, user } = await requirePlatformPermission("saas.organizations.create");
  const extraFeatureIds = formData
    .getAll("extraFeatureIds")
    .map((value) => String(value))
    .filter(Boolean);
  const extraUsers = formData.get("extraUserLimit");
  const extraSites = formData.get("extraSiteLimit");
  const org = await createOrganizationAdmin(supabase, {
    userId: user.id,
    name: String(formData.get("name") || ""),
    legalName: String(formData.get("legalName") || "") || undefined,
    industry: String(formData.get("industry") || "") || undefined,
    companySize: String(formData.get("companySize") || "") || undefined,
    country: String(formData.get("country") || "") || undefined,
    timezone: String(formData.get("timezone") || "") || undefined,
    planId: String(formData.get("planId") || ""),
    billingCycle: (String(formData.get("billingCycle") || "monthly") as
      | "monthly"
      | "yearly"
      | "custom"),
    customMonthlyCents: formData.get("customMonthlyCents")
      ? Number(formData.get("customMonthlyCents"))
      : null,
    discountCents: formData.get("discountCents")
      ? Number(formData.get("discountCents"))
      : 0,
    notes: String(formData.get("notes") || "") || undefined,
    adminEmail: String(formData.get("adminEmail") || "") || undefined,
    trialDays: formData.get("trialDays") ? Number(formData.get("trialDays")) : undefined,
    extraFeatureIds,
    extraUserLimit: extraUsers ? Number(extraUsers) : null,
    extraSiteLimit: extraSites ? Number(extraSites) : null,
  });
  redirect(`/admin/organizations/${org.id}`);
}

export async function adminCreatePlanAction(formData: FormData) {
  const { supabase, user } = await requirePlatformPermission("saas.plans.manage");
  await createPlan(supabase, {
    userId: user.id,
    name: String(formData.get("name") || ""),
    code: String(formData.get("code") || "") || undefined,
    description: String(formData.get("description") || "") || undefined,
    planType: String(formData.get("planType") || "standard"),
    priceMonthlyCents: Math.round(Number(formData.get("priceMonthly") || 0) * 100),
    priceYearlyCents: Math.round(Number(formData.get("priceYearly") || 0) * 100),
    isPublic: formData.get("isPublic") === "true",
    isCustom: formData.get("planType") === "custom",
  });
  revalidatePath("/admin/plans");
  revalidatePath("/admin/entitlements");
}

export async function adminDuplicatePlanAction(formData: FormData) {
  const { supabase, user } = await requirePlatformPermission("saas.plans.manage");
  await duplicatePlan(supabase, {
    userId: user.id,
    planId: String(formData.get("planId") || ""),
  });
  revalidatePath("/admin/plans");
}

export async function adminArchivePlanAction(formData: FormData) {
  const { supabase, user } = await requirePlatformPermission("saas.plans.manage");
  await archivePlan(supabase, {
    userId: user.id,
    planId: String(formData.get("planId") || ""),
  });
  revalidatePath("/admin/plans");
}

export async function adminUpsertPlanFeatureAction(formData: FormData) {
  const { supabase, user } = await requirePlatformPermission("saas.plans.manage");
  await upsertPlanFeatureCell(supabase, {
    userId: user.id,
    planId: String(formData.get("planId") || ""),
    featureId: String(formData.get("featureId") || ""),
    enabled: formData.get("enabled") === "true",
    limitValue: formData.get("limitValue") ? Number(formData.get("limitValue")) : null,
  });
  revalidatePath("/admin/entitlements");
  revalidatePath("/admin/plans");
}

export async function adminCreateFeatureAction(formData: FormData) {
  const { supabase, user } = await requirePlatformPermission("saas.features.manage");
  await createCatalogFeature(supabase, {
    userId: user.id,
    code: String(formData.get("code") || ""),
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || "") || undefined,
    catalogGroup: String(formData.get("catalogGroup") || "ehs"),
    featureType: String(formData.get("featureType") || "boolean"),
  });
  revalidatePath("/admin/features");
  revalidatePath("/admin/entitlements");
}

export async function adminApplyDiscountAction(formData: FormData) {
  const { supabase, user } = await requirePlatformPermission("saas.subscriptions.manage");
  await applySubscriptionDiscount(supabase, {
    userId: user.id,
    subscriptionId: String(formData.get("subscriptionId") || ""),
    discountCents: Number(formData.get("discountCents") || 0),
    reason: String(formData.get("reason") || "") || undefined,
  });
  revalidatePath("/admin/subscriptions");
}

export async function adminCancelSubscriptionAction(formData: FormData) {
  const { supabase, user } = await requirePlatformPermission("saas.subscriptions.manage");
  await cancelSubscriptionAdmin(supabase, {
    userId: user.id,
    subscriptionId: String(formData.get("subscriptionId") || ""),
    atPeriodEnd: formData.get("atPeriodEnd") === "true",
    reason: String(formData.get("reason") || "") || undefined,
  });
  revalidatePath("/admin/subscriptions");
}

export async function adminUpdatePlatformSettingAction(
  formData: FormData,
): Promise<void> {
  const { supabase, user } = await requirePlatformPermission("saas.organizations.update");
  const key = String(formData.get("key") || "");
  const valueRaw = String(formData.get("value") || "{}");
  let value: unknown = {};
  try {
    value = JSON.parse(valueRaw);
  } catch {
    throw new Error("Value must be valid JSON");
  }

  const { error } = await supabase.from("platform_settings").upsert({
    key,
    value,
    updated_by: user.id,
  });
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorUserId: user.id,
    action: "saas.platform_settings.updated",
    entityType: "platform_settings",
    newValues: { key, value },
  });

  revalidatePath("/admin/settings");
}
