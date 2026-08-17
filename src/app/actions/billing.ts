"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/auth/org-context";
import { requirePermission } from "@/lib/services/rbac";
import { writeAuditLog } from "@/lib/services/audit";

export async function requestPlanChangeAction(formData: FormData): Promise<void> {
  const { supabase, user, organization } = await requireOrgContext();
  await requirePermission(supabase, organization.id, user.id, "billing.view");
  const planId = String(formData.get("planId") || "");
  if (!planId) return;

  const { data: current } = await supabase
    .from("subscriptions")
    .select("id, plan_id, status, plans:plan_id(price_monthly_cents, sort_order)")
    .eq("organization_id", organization.id)
    .is("deleted_at", null)
    .maybeSingle();

  const { data: nextPlan } = await supabase
    .from("plans")
    .select("id, price_monthly_cents, sort_order, name")
    .eq("id", planId)
    .maybeSingle();
  if (!nextPlan) return;

  const currentPrice = Number(
    (current?.plans as { price_monthly_cents?: number } | null)?.price_monthly_cents ?? 0,
  );
  const isUpgrade = nextPlan.price_monthly_cents >= currentPrice;

  if (current && isUpgrade) {
    await supabase
      .from("subscriptions")
      .update({
        plan_id: planId,
        status: "active",
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", current.id);
  } else if (current) {
    await supabase
      .from("subscriptions")
      .update({
        metadata: { pending_plan_id: planId, change: "downgrade_next_cycle" },
        updated_by: user.id,
      })
      .eq("id", current.id);
  } else {
    await supabase.from("subscriptions").insert({
      organization_id: organization.id,
      plan_id: planId,
      status: "active",
      created_by: user.id,
    });
  }

  await writeAuditLog(supabase, {
    organizationId: organization.id,
    actorUserId: user.id,
    action: isUpgrade ? "billing.upgraded" : "billing.downgrade_scheduled",
    entityType: "subscription",
    newValues: { planId, immediate: isUpgrade },
  });

  revalidatePath("/app/settings/billing");
}
