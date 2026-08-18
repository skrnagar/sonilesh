"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/events";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";

export async function saveMetricTargetAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "advanced_analytics",
      permission: "analytics.manage",
    });
    if (!access.entitled) return { ok: false, error: "Upgrade required for advanced analytics." };
    if (!access.permitted) return { ok: false, error: "Missing permission: analytics.manage" };

    const metricCode = String(formData.get("metricCode") || "").trim();
    const targetValue = Number(formData.get("targetValue"));
    if (!metricCode || Number.isNaN(targetValue)) {
      return { ok: false, error: "Metric and numeric target are required." };
    }
    const warningRaw = String(formData.get("warningValue") || "").trim();
    const { error } = await access.supabase.from("metric_targets").insert({
      organization_id: access.organization.id,
      metric_code: metricCode,
      target_value: targetValue,
      warning_value: warningRaw ? Number(warningRaw) : null,
      period_kind: String(formData.get("periodKind") || "fy"),
      created_by: access.user.id,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/app/settings/analytics/targets");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function saveWorkforceHoursAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "advanced_analytics",
      permission: "analytics.manage",
    });
    if (!access.entitled) return { ok: false, error: "Upgrade required for advanced analytics." };
    if (!access.permitted) return { ok: false, error: "Missing permission: analytics.manage" };

    const hours = Number(formData.get("hours"));
    const periodStart = String(formData.get("periodStart") || "");
    const periodEnd = String(formData.get("periodEnd") || "");
    if (Number.isNaN(hours) || hours < 0 || !periodStart || !periodEnd) {
      return { ok: false, error: "Hours and period dates are required." };
    }
    const siteId = String(formData.get("siteId") || "") || null;
    const { error } = await access.supabase.from("workforce_hours").insert({
      organization_id: access.organization.id,
      site_id: siteId,
      period_start: periodStart,
      period_end: periodEnd,
      hours,
      source: "manual",
      created_by: access.user.id,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/app/settings/analytics/targets");
    revalidatePath("/app/analytics/workforce");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function saveAnalyticsViewAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "advanced_analytics",
      permission: "analytics.view",
    });
    if (!access.entitled) return { ok: false, error: "Upgrade required for advanced analytics." };
    if (!access.permitted) return { ok: false, error: "Missing permission: analytics.view" };

    const name = String(formData.get("name") || "").trim();
    const hrefPath = String(formData.get("hrefPath") || "/app/analytics").trim();
    if (name.length < 2) return { ok: false, error: "Name is required." };
    const { error } = await access.supabase.from("saved_views").insert({
      organization_id: access.organization.id,
      owner_user_id: access.user.id,
      name,
      href_path: hrefPath,
      filters: {
        range: String(formData.get("range") || ""),
        siteId: String(formData.get("siteId") || ""),
        projectId: String(formData.get("projectId") || ""),
        departmentId: String(formData.get("departmentId") || ""),
        businessUnitId: String(formData.get("businessUnitId") || ""),
        dateFrom: String(formData.get("dateFrom") || ""),
        dateTo: String(formData.get("dateTo") || ""),
      },
      is_shared: formData.get("shared") === "on",
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/app/analytics/dashboards");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}
