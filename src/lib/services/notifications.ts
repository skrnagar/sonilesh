import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";

export type NotificationRow = {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

/** Roles that receive org/site EHS alert fan-out (supervisors + tenant admins). */
export const EHS_NOTIFICATION_ROLES = [
  "tenant_admin",
  "ehs_admin",
  "ehs_manager",
  "ehs_officer",
  "site_manager",
  "supervisor",
] as const;

const INCIDENT_EVENT_KEYS = new Set([
  "ehs_event.created",
  "ehs_event.assigned",
  "incident.alert",
  "capa.assigned",
  "capa.verified",
  "capa.closed",
  "capa.overdue",
  "permit.requested",
  "permit.approved",
  "permit.rejected",
  "permit.suspended",
  "compliance.due",
  "compliance.overdue",
  "inspection.assigned",
  "document.approved",
  "moc.approved",
]);

export function incidentAlertsEnabled(config: unknown): boolean {
  if (!config || typeof config !== "object") return true;
  return (config as Record<string, unknown>).incident_alerts !== false;
}

export function recipientsAfterPreferences(
  userIds: string[],
  prefs: { user_id: string; enabled: boolean }[],
): string[] {
  if (!prefs.length) return userIds;
  const disabled = new Set(
    prefs.filter((p) => p.enabled === false).map((p) => p.user_id),
  );
  return userIds.filter((id) => !disabled.has(id));
}

async function orgAllowsEvent(
  supabase: SupabaseClient,
  organizationId: string,
  eventKey?: string,
): Promise<boolean> {
  if (!eventKey || !INCIDENT_EVENT_KEYS.has(eventKey)) return true;

  const { data } = await supabase
    .from("organization_settings")
    .select("notification_config")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const config = data?.notification_config;
  return incidentAlertsEnabled(config);
}

async function filterByUserPreferences(
  supabase: SupabaseClient,
  organizationId: string,
  userIds: string[],
  eventKey?: string,
): Promise<string[]> {
  if (!eventKey || !userIds.length) return userIds;

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("user_id, enabled")
    .eq("organization_id", organizationId)
    .eq("channel", "in_app")
    .eq("event_key", eventKey)
    .in("user_id", userIds);

  if (!prefs?.length) return userIds;
  return recipientsAfterPreferences(
    userIds,
    prefs.map((p) => ({ user_id: p.user_id as string, enabled: Boolean(p.enabled) })),
  );
}

export async function notifyUsers(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userIds: string[];
    title: string;
    body?: string;
    link?: string;
    actorUserId?: string;
    eventKey?: string;
  },
) {
  const unique = Array.from(new Set(input.userIds.filter(Boolean)));
  if (!unique.length) return;

  const allowed = await orgAllowsEvent(supabase, input.organizationId, input.eventKey);
  if (!allowed) return;

  // Filter by event key only for keys tracked in INCIDENT_EVENT_KEYS to avoid
  // unnecessary DB round-trips for generic events.
  const recipients = await filterByUserPreferences(
    supabase,
    input.organizationId,
    unique,
    input.eventKey,
  );
  if (!recipients.length) return;

  const rows = recipients.map((userId) => ({
    organization_id: input.organizationId,
    user_id: userId,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
  }));

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) {
    console.error("[notify] insert failed", error.message);
    return;
  }

  try {
    await writeAuditLog(supabase, {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId ?? null,
      action: "notification.queued",
      entityType: "notification",
      newValues: {
        title: input.title,
        recipients: recipients.length,
        event_key: input.eventKey ?? null,
      },
    });
  } catch (err) {
    console.error("[notify] audit failed", err);
  }
}

export async function notifySiteSupervisors(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    siteId?: string | null;
    title: string;
    body?: string;
    link?: string;
    actorUserId: string;
    eventKey?: string;
  },
) {
  const { data: members } = await supabase
    .from("organization_members")
    .select("id, user_id")
    .eq("organization_id", input.organizationId)
    .eq("status", "active")
    .is("deleted_at", null);

  const memberIds = (members ?? []).map((m) => m.id);
  if (!memberIds.length) return;

  const { data: roles } = await supabase
    .from("member_roles")
    .select("member_id, site_id, roles:role_id(code)")
    .in("member_id", memberIds)
    .is("deleted_at", null);

  const userByMember = new Map((members ?? []).map((m) => [m.id, m.user_id]));
  const recipientSet = new Set<string>();
  for (const row of roles ?? []) {
    const code = (row.roles as { code?: string } | null)?.code;
    if (!code) continue;
    if (!(EHS_NOTIFICATION_ROLES as readonly string[]).includes(code)) continue;
    // org-level roles (site_id null) always match; site-scoped roles only match the requested site.
    if (input.siteId && row.site_id && row.site_id !== input.siteId) continue;
    const userId = userByMember.get(row.member_id);
    if (userId && userId !== input.actorUserId) recipientSet.add(userId);
  }

  await notifyUsers(supabase, {
    organizationId: input.organizationId,
    userIds: Array.from(recipientSet),
    title: input.title,
    body: input.body,
    link: input.link,
    actorUserId: input.actorUserId,
    eventKey: input.eventKey,
  });
}

export async function listNotificationsForUser(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    limit?: number;
    unreadOnly?: boolean;
  },
): Promise<NotificationRow[]> {
  let query = supabase
    .from("notifications")
    .select("id, organization_id, user_id, title, body, link, read_at, created_at")
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 40);

  if (input.unreadOnly) {
    query = query.is("read_at", null);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[notify] list failed", error.message);
    return [];
  }
  return (data ?? []) as NotificationRow[];
}

export async function countUnreadNotifications(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    console.error("[notify] unread count failed", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function markNotificationRead(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; notificationId: string },
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", input.notificationId)
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId)
    .is("read_at", null);

  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string },
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId)
    .is("read_at", null);

  if (error) throw new Error(error.message);
}
