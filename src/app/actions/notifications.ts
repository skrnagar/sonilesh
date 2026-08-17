"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/auth/org-context";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/services/notifications";

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const notificationId = String(formData.get("notificationId") || "");
  if (!notificationId) return;

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
}

export async function markAllNotificationsReadAction(formData?: FormData): Promise<void> {
  void formData;
  const { supabase, user, organization } = await requireOrgContext();
  await markAllNotificationsRead(supabase, {
    organizationId: organization.id,
    userId: user.id,
  });
  revalidatePath("/app", "layout");
  revalidatePath("/app/notifications");
  revalidatePath("/field", "layout");
  revalidatePath("/field/notifications");
}
