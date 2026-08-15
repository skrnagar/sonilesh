"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/session";
import {
  changeOrganizationPlan,
  updateOrganizationStatus,
  upsertFeatureOverride,
} from "@/lib/services/admin";
import { writeAuditLog } from "@/lib/services/audit";

export async function adminUpdateOrgStatusAction(formData: FormData) {
  const { supabase, user } = await requirePlatformAdmin();
  await updateOrganizationStatus(supabase, {
    userId: user.id,
    organizationId: String(formData.get("organizationId") || ""),
    status: String(formData.get("status") || ""),
    reason: String(formData.get("reason") || "") || undefined,
  });
  revalidatePath("/admin/organizations");
}

export async function adminChangePlanAction(formData: FormData) {
  const { supabase, user } = await requirePlatformAdmin();
  const customMonthly = formData.get("customPriceMonthlyCents");
  const extendTrial = formData.get("extendTrialDays");
  await changeOrganizationPlan(supabase, {
    userId: user.id,
    organizationId: String(formData.get("organizationId") || ""),
    planId: String(formData.get("planId") || ""),
    customPriceMonthlyCents: customMonthly ? Number(customMonthly) : null,
    extendTrialDays: extendTrial ? Number(extendTrial) : undefined,
  });
  revalidatePath(`/admin/organizations/${String(formData.get("organizationId") || "")}`);
}

export async function adminFeatureOverrideAction(formData: FormData) {
  const { supabase, user } = await requirePlatformAdmin();
  await upsertFeatureOverride(supabase, {
    userId: user.id,
    organizationId: String(formData.get("organizationId") || ""),
    featureId: String(formData.get("featureId") || ""),
    enabled: formData.get("enabled") === "true",
    limitValue: formData.get("limitValue")
      ? Number(formData.get("limitValue"))
      : null,
    unlimited: formData.get("unlimited") === "true",
    isTemporary: formData.get("isTemporary") === "true",
    endsAt: String(formData.get("endsAt") || "") || null,
    reason: String(formData.get("reason") || "") || undefined,
  });
  revalidatePath(`/admin/organizations/${String(formData.get("organizationId") || "")}`);
}

export async function adminUpdatePlatformSettingAction(
  formData: FormData,
): Promise<void> {
  const { supabase, user } = await requirePlatformAdmin();
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
