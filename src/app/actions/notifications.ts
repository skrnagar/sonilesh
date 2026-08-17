"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/auth/org-context";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/services/notifications";

export async function markNotificationReadAction(formData: FormData) {
  const notificationId = String(formData.get("notificationId") || "");
  if (!notificationId) return { ok: false as const, error: "Missing notification" };

  const { supabase, user, organization } = await requireOrgContext();
  await markNotificationRead(supabase, {
    organizationId: organization.id,
    userId: user.id,
    notificationId,
  });
  revalidatePath("/app", "layout");
  revalidatePath("/app/notifications");
  revalidatePath("/field", "layout");
  revalidatePath("/field/notifications");
  return { ok: true as const };
}

export async function markAllNotificationsReadAction() {
  const { supabase, user, organization } = await requireOrgContext();
  await markAllNotificationsRead(supabase, {
    organizationId: organization.id,
    userId: user.id,
  });
  revalidatePath("/app", "layout");
  revalidatePath("/app/notifications");
  revalidatePath("/field", "layout");
  revalidatePath("/field/notifications");
  return { ok: true as const };
}
