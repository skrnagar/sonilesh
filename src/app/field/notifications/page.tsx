import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import { NotificationList } from "@/components/layout/notification-inbox";
import { Button } from "@/components/ui/button";
import { requireOrgContext } from "@/lib/auth/org-context";
import {
  countUnreadNotifications,
  listNotificationsForUser,
} from "@/lib/services/notifications";

export default async function FieldNotificationsPage() {
  const { supabase, user, organization } = await requireOrgContext();

  const [items, unreadCount] = await Promise.all([
    listNotificationsForUser(supabase, {
      organizationId: organization.id,
      userId: user.id,
      limit: 50,
    }),
    countUnreadNotifications(supabase, organization.id, user.id),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 ? (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="outline" size="sm" className="rounded-xl">
              Mark all read
            </Button>
          </form>
        ) : null}
      </div>
      <NotificationList items={items} />
    </div>
  );
}
