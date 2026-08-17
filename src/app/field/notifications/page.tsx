import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import { NotificationList } from "@/components/layout/notification-inbox";
import { requireOrgContext } from "@/lib/auth/org-context";
import { countFieldUnread } from "@/lib/field/unread";
import { listNotificationsForUser } from "@/lib/services/notifications";
import { FieldPageHeader, fieldSecondaryBtnClass } from "@/components/field/field-ui";

export default async function FieldNotificationsPage() {
  const { supabase, user, organization } = await requireOrgContext();

  const [items, unreadCount] = await Promise.all([
    listNotificationsForUser(supabase, {
      organizationId: organization.id,
      userId: user.id,
      limit: 50,
    }),
    countFieldUnread(supabase, organization.id, user.id),
  ]);

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}`
            : "All caught up"
        }
      />
      {unreadCount > 0 ? (
        <form action={markAllNotificationsReadAction}>
          <button type="submit" className={fieldSecondaryBtnClass}>
            Mark all read
          </button>
        </form>
      ) : null}
      <NotificationList items={items} />
    </div>
  );
}
