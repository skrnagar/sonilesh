import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import { NotificationList } from "@/components/layout/notification-inbox";
import { Button } from "@/components/ui/button";
import { requireOrgContext } from "@/lib/auth/org-context";
import {
  countUnreadNotifications,
  listNotificationsForUser,
} from "@/lib/services/notifications";

export default async function NotificationsPage() {
  const { supabase, user, organization } = await requireOrgContext();

  const [items, unreadCount] = await Promise.all([
    listNotificationsForUser(supabase, {
      organizationId: organization.id,
      userId: user.id,
      limit: 100,
    }),
    countUnreadNotifications(supabase, organization.id, user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}`
              : "All caught up for this workspace"}
          </p>
        </div>
        {unreadCount > 0 ? (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="outline" size="sm" className="rounded-xl">
              Mark all as read
            </Button>
          </form>
        ) : null}
      </div>
      <NotificationList items={items} />
    </div>
  );
}
