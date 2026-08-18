"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/auth/org-context";
import {
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRow,
} from "@/lib/services/notifications";

export async function listRecentNotificationsAction(): Promise<NotificationRow[]> {
  const { supabase, user, organization } = await requireOrgContext();
  return listNotificationsForUser(supabase, {
    organizationId: organization.id,
    userId: user.id,
    limit: 12,
  });
}

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const notificationId = String(formData.get("notificationId") || "");
  if (!notificationId) return;

  const { supabase, user, organization } = await requireOrgContext();
  await markNotificationRead(supabase, {
    organizationId: organization.id,
    userId: user.id,
    notificationId,
  });
  revalidatePath("/app/notifications");
  revalidatePath("/field/notifications");
  // Revalidate layouts so the bell badge count refreshes.
  revalidatePath("/app", "layout");
  revalidatePath("/field", "layout");
}

export async function markAllNotificationsReadAction(formData?: FormData): Promise<void> {
  void formData;
  const { supabase, user, organization } = await requireOrgContext();
  await markAllNotificationsRead(supabase, {
    organizationId: organization.id,
    userId: user.id,
  });
  revalidatePath("/app/notifications");
  revalidatePath("/field/notifications");
  revalidatePath("/app", "layout");
  revalidatePath("/field", "layout");
}
